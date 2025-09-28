import { encodePacket, decodePacket, type PacketEvent, type PacketHeader } from "@/adapter/packet";

// 協定常數定義
const MAX_PAYLOAD_SIZE = 16384; // 協定中 framing 實際用到的最大 payload 大小 (16KB)
const MAX_CHUNK_ID = 65535; // chunk_id 的最大值
const MAX_TOTAL_CHUNKS = 65535; // total_chunks 的最大值
const MAX_SOCKET_ID = 65535; // socket_id 的最大值

// 重組器狀態
interface ReassemblerEntry {
  chunks: Map<number, Buffer>; // chunkIndex -> payload
  totalChunks: number;
  createdAt: number; // timestamp for cleanup
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
