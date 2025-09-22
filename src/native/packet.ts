/**
 * 封包處理模組
 *
 * 支援將 TCP 訊息封裝成帶有 Header 的 chunk，並在對端重組還原
 * Header 格式詳見 README.md
 */

// Header 常數定義
const HEADER_SIZE = 11; // 11 bytes 固定 header 大小
const MAX_PAYLOAD_SIZE = 65525; // 最大 payload 大小 (65535 - HEADER_SIZE + 1)
const MAX_CHUNK_ID = 65535; // chunk_id 的最大值
const MAX_TOTAL_CHUNKS = 65535; // total_chunks 的最大值
const MAX_SOCKET_ID = 65535; // socket_id 的最大值

// 事件類型
export enum PacketEvent {
  DATA = 0,
  CLOSE = 1,
  CONNECT = 2,
}

// 封包 Header 結構
interface PacketHeader {
  event: PacketEvent; // 事件類型 (0=DATA, 1=CLOSE, 2=CONNECT, …)
  socketId: number; // 對應一條 TCP socket 連線 (0-65535)
  chunkId: number; // 一次完整訊息的唯一識別 (0-65535)
  chunkIndex: number; // 本片段序號 (0-65535)
  totalChunks: number; // 總片段數 (1-65535)
  payloadSize: number; // 本片段大小 (0-65525)
}

// 重組器狀態
interface ReassemblerEntry {
  chunks: Map<number, Buffer>; // chunkIndex -> payload
  totalChunks: number;
  receivedChunks: number;
  createdAt: number; // timestamp for cleanup
}

/**
 * 將 Header 和 payload 編碼成一個完整的封包
 */
function encodePacket(header: PacketHeader, payload: Buffer): Buffer {
  if (payload.length !== header.payloadSize) {
    throw new Error(`Payload size mismatch: expected ${header.payloadSize}, got ${payload.length}`);
  }

  if (header.payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload size ${header.payloadSize} exceeds maximum ${MAX_PAYLOAD_SIZE}`);
  }

  const packet = Buffer.allocUnsafe(HEADER_SIZE + payload.length);
  let offset = 0;

  // [0] event (1 byte)
  packet.writeUInt8(header.event, offset++);

  // [1-2] socket_id (2 bytes)
  packet.writeUInt16BE(header.socketId, offset);
  offset += 2;

  // [3-4] chunk_id (2 bytes)
  packet.writeUInt16BE(header.chunkId, offset);
  offset += 2;

  // [5-6] chunk_index (2 bytes)
  packet.writeUInt16BE(header.chunkIndex, offset);
  offset += 2;

  // [7-8] total_chunks (2 bytes)
  packet.writeUInt16BE(header.totalChunks, offset);
  offset += 2;

  // [9-10] payload_size (2 bytes)
  packet.writeUInt16BE(header.payloadSize, offset);
  offset += 2;

  // [11-] payload
  payload.copy(packet, offset);

  return packet;
}

/**
 * 將封包解碼成 Header 和 payload
 */
function decodePacket(packet: Buffer): { header: PacketHeader; payload: Buffer } {
  if (packet.length < HEADER_SIZE) {
    throw new Error(`Packet too small: expected at least ${HEADER_SIZE} bytes, got ${packet.length}`);
  }

  let offset = 0;

  // [0] event
  const event = packet.readUInt8(offset++);

  // [1-2] socket_id
  const socketId = packet.readUInt16BE(offset);
  offset += 2;

  // [3-4] chunk_id
  const chunkId = packet.readUInt16BE(offset);
  offset += 2;

  // [5-6] chunk_index
  const chunkIndex = packet.readUInt16BE(offset);
  offset += 2;

  // [7-8] total_chunks
  const totalChunks = packet.readUInt16BE(offset);
  offset += 2;

  // [9-10] payload_size
  const payloadSize = packet.readUInt16BE(offset);
  offset += 2;

  // 驗證 payload 大小
  const expectedPacketSize = HEADER_SIZE + payloadSize;
  if (packet.length !== expectedPacketSize) {
    throw new Error(`Packet size mismatch: expected ${expectedPacketSize}, got ${packet.length}`);
  }

  // [11-] payload
  const payload = packet.subarray(offset);

  const header: PacketHeader = { event, socketId, chunkId, chunkIndex, totalChunks, payloadSize };
  return { header, payload };
}

/**
 * 建立 Chunker，用於將訊息切割成多個 chunk
 */
export function createChunker(socketId: number) {
  if (socketId > MAX_SOCKET_ID) {
    throw new Error(`Socket ID ${socketId} exceeds maximum ${MAX_SOCKET_ID}`);
  }

  let currentChunkId = 0; // 在 closure 中維護的 chunk_id 計數器

  /**
   * 將大訊息切割成多個 chunk (Generator 函數)
   */
  function* splitPayload(event: PacketEvent, data: Buffer): Generator<Buffer, void, unknown> {
    // 使用並遞增 chunk_id，循環使用 0~65535 (原因請參考 README.md，不需 review)
    const chunkId = currentChunkId;
    currentChunkId = (currentChunkId + 1) % (MAX_CHUNK_ID + 1);

    // 計算需要多少個 chunk
    const totalChunks = Math.max(1, Math.ceil(data.length / MAX_PAYLOAD_SIZE));

    if (totalChunks > MAX_TOTAL_CHUNKS) {
      throw new Error(`Data too large: requires ${totalChunks} chunks, maximum is ${MAX_TOTAL_CHUNKS}`);
    }

    // 生成每個 chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * MAX_PAYLOAD_SIZE;
      const end = Math.min(start + MAX_PAYLOAD_SIZE, data.length);
      const payload = data.subarray(start, end);
      const payloadSize = payload.length;

      const header: PacketHeader = { event, socketId, chunkId, chunkIndex, totalChunks, payloadSize };
      yield encodePacket(header, payload);
    }
  }

  /**
   * 取得目前的 chunk_id 值（用於偵錯）
   */
  function getCurrentChunkId(): number {
    return currentChunkId;
  }

  return { splitPayload, getCurrentChunkId };
}

/**
 * 建立重組器，用於將接收到的 chunk 重組成完整訊息
 */
export function createReassembler() {
  const reassemblerMap = new Map<string, ReassemblerEntry>(); // key: `${socketId}:${chunkId}`
  const CLEANUP_INTERVAL = 30000; // 30秒清理一次
  const ENTRY_TIMEOUT = 60000; // 60秒未完成的項目會被清理

  // 定期清理超時的重組項目
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of reassemblerMap.entries()) {
      if (now - entry.createdAt > ENTRY_TIMEOUT) reassemblerMap.delete(key);
    }
  }, CLEANUP_INTERVAL);

  /**
   * 處理接收到的封包，如果完整訊息重組完成則回傳完整資料
   */
  function processPacket(packet: Buffer): { socketId: number; event: PacketEvent; data: Buffer } | null {
    const { header, payload } = decodePacket(packet);
    const { socketId, chunkId, chunkIndex, totalChunks, event } = header;

    // 如果只有一個 chunk，直接回傳
    if (totalChunks === 1) {
      return { socketId, event, data: payload };
    }

    // 多 chunk 情況，需要重組
    const key = `${socketId}:${chunkId}`;

    // 取得或建立重組項目
    let entry = reassemblerMap.get(key);
    if (!entry) {
      entry = { chunks: new Map(), totalChunks, receivedChunks: 0, createdAt: Date.now() };
      reassemblerMap.set(key, entry);
    }

    // 檢查 totalChunks 是否一致
    if (entry.totalChunks !== totalChunks) {
      // 清理並重新開始
      reassemblerMap.delete(key);
      entry = { chunks: new Map(), totalChunks, receivedChunks: 0, createdAt: Date.now() };
      reassemblerMap.set(key, entry);
    }

    // 如果已經有這個 chunk，忽略（避免重複）
    if (entry.chunks.has(chunkIndex)) {
      return null;
    }

    // 儲存 chunk
    entry.chunks.set(chunkIndex, payload);
    entry.receivedChunks++;

    // 檢查是否完整
    if (entry.receivedChunks === totalChunks) {
      // 重組完整訊息
      const chunks: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunk = entry.chunks.get(i);
        if (!chunk) {
          // 這不應該發生，但為了安全起見
          reassemblerMap.delete(key);
          return null;
        }
        chunks.push(chunk);
      }

      // 清理
      reassemblerMap.delete(key);

      return { socketId, event, data: Buffer.concat(chunks) };
    }

    // 還沒重組完成
    return null;
  }

  /**
   * 清理重組器資源
   */
  function cleanup() {
    clearInterval(cleanupTimer);
    reassemblerMap.clear();
  }

  /**
   * 取得目前重組器統計資訊
   */
  function getStats() {
    return {
      pendingReassembly: reassemblerMap.size,
      entries: Array.from(reassemblerMap.entries()).map(([key, entry]) => ({
        key,
        receivedChunks: entry.receivedChunks,
        totalChunks: entry.totalChunks,
        age: Date.now() - entry.createdAt,
      })),
    };
  }

  return { processPacket, cleanup, getStats };
}
