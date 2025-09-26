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

// 封包 Header 結構，格式詳見 README.md
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
function createChunker(socketId: number) {
  type GeneratorReturnType = Generator<Buffer, void, unknown>;
  type Counter = number;
  let currentCount: Counter = 0;

  /**
   * 使用並遞增指定 socket 的 currentCount，循環使用 0~65535 (原因請參考 README.md，不需 review)
   */
  const getCurrentCount = (): number => {
    const count = currentCount;
    currentCount = (currentCount + 1) % (MAX_CHUNK_ID + 1);
    return count;
  };

  /**
   * 將單個大訊息切割成多個 chunk ，每次使用時會消耗一次內部的 chunk_id (Generator 函數)
   */
  const generateChunks = function* (event: PacketEvent, data: Buffer): GeneratorReturnType {
    if (socketId < 0 || socketId > MAX_SOCKET_ID) {
      throw new Error(`Socket ID ${socketId} exceeds maximum ${MAX_SOCKET_ID}`);
    }

    const chunkId = getCurrentCount();

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
  };

  return { generateChunks };
}

/**
 * 建立重組器映射，用於管理未完成的重組任務
 */
function createReassemblerMap(entryTimeout: number) {
  const map = new Map<string, ReassemblerEntry>(); // key: `${socketId}:${chunkId}`

  const prune = () => {
    const now = Date.now();
    for (const [key, entry] of map.entries()) {
      if (now - entry.createdAt > entryTimeout) map.delete(key);
    }
  };

  const get = (socketId: number, chunkId: number, totalChunks: number): ReassemblerEntry => {
    const key = `${socketId}:${chunkId}`;
    let entry = map.get(key);
    if (!entry || entry.totalChunks !== totalChunks) {
      entry = { chunks: new Map(), totalChunks, createdAt: Date.now() };
      map.set(key, entry);
    }
    return entry;
  };

  const getStats = () => ({
    size: map.size,
    entries: Array.from(map.entries()).map(([key, entry]) => ({
      key,
      receivedChunks: entry.chunks.size,
      totalChunks: entry.totalChunks,
      age: Date.now() - entry.createdAt,
    })),
  });

  const remove = (socketId: number, chunkId: number) => {
    const key = `${socketId}:${chunkId}`;
    map.delete(key);
  };

  const clear = () => map.clear();

  return { get, remove, clear, getStats, prune };
}

/**
 * 建立重組器，用於將接收到的 chunk 重組成完整訊息
 */
function createReassembler() {
  const reassemblerMap = createReassemblerMap(60000); // 60秒未完成的項目會被清理

  /**
   * 處理接收到的封包，如果完整訊息重組完成則回傳完整資料
   */
  function processPacket(packet: Buffer): { socketId: number; event: PacketEvent; data: Buffer } | null {
    reassemblerMap.prune();

    const { header, payload } = decodePacket(packet);
    const { socketId, chunkId, chunkIndex, totalChunks, event } = header;
    if (totalChunks === 1) {
      return { socketId, event, data: payload };
    }

    const entry = reassemblerMap.get(socketId, chunkId, totalChunks);
    entry.chunks.set(chunkIndex, payload);
    if (entry.chunks.size !== totalChunks) {
      return null;
    }

    // 重組完整訊息
    const chunks = Array.from(entry.chunks.entries())
      .sort(([a], [b]) => a - b)
      .map(([, buf]) => buf);

    // 理論上不應該發生，但保險起見還是檢查
    if (chunks.length !== totalChunks) {
      reassemblerMap.remove(socketId, chunkId);
      return null;
    }

    // 清理並回傳完整訊息
    reassemblerMap.remove(socketId, chunkId);
    return { socketId, event, data: Buffer.concat(chunks) };
  }

  // 暴露統計資訊和清理函數
  const { getStats, clear } = reassemblerMap;
  return { processPacket, close: clear, getStats };
}

export { createChunker, createReassembler };
