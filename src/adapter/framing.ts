import { encodePacket, decodePacket, type PacketEvent, type PacketHeader } from "@/adapter/packet";

// 協定常數定義
const MAX_PAYLOAD_SIZE = 16384; // 協定中 framing 實際用到的最大 payload 大小 (16KB)
const MAX_CHUNK_ID = 65535; // chunk_id 的最大值
const MAX_TOTAL_CHUNKS = 65535; // total_chunks 的最大值
const MAX_SOCKET_ID = 65535; // socket_id 的最大值

/**
 * 同時用於 chunker 與 ressembler 的序號管理器，類似 RFC 1982 的序號比較實作
 */
const createSequenceMap = () => {
  type Key = number; // socketId
  type Value = number; // 同時代表 下一個要使用的序號(chunker) 或是 目前的最早序號(ressembler)
  const map = new Map<Key, Value>();

  // 取得並遞增序號，循環使用 0 ~ MAX_CHUNK_ID
  const use = (socketId: number) => {
    const current = map.get(socketId) || 0;
    map.set(socketId, (current + 1) % (MAX_CHUNK_ID + 1));
    return current;
  };

  // 取得當前序號但不遞增
  const get = (socketId: number) => {
    return map.get(socketId) || 0;
  };

  return { use, get };
};

/**
 * 建立 Chunker，用於將訊息切割成多個 chunk
 */
const createChunker = () => {
  type GeneratorReturnType = Generator<Buffer, void, unknown>;
  const { use } = createSequenceMap();

  /**
   * 將單個大訊息切割成多個 chunk ，每次使用時會消耗一次內部的 chunk_id (Generator 函數)
   */
  const generate = function* (socketId: number, event: PacketEvent, data: Buffer): GeneratorReturnType {
    if (socketId < 0 || socketId > MAX_SOCKET_ID) {
      throw new Error(`Socket ID ${socketId} exceeds maximum ${MAX_SOCKET_ID}`);
    }

    const chunkId = use(socketId);

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

  return { generate };
};

/**
 * 建立重組器映射，用於管理未完成的重組任務
 */
const createReassemblerMap = () => {
  // socketId → (chunkId → chunk 陣列，依 chunkIndex 填充，缺塊為 null)
  type RessemblerMap = Map<number, Map<number, { event: PacketEvent; payload: Array<Buffer | null> }>>;
  const map: RessemblerMap = new Map();
  const expectedSeqMap = createSequenceMap();

  const addPacket = (header: PacketHeader, payload: Buffer) => {
    const { socketId, event, chunkId, chunkIndex, totalChunks } = header;

    let messages = map.get(socketId);
    if (!messages) {
      messages = new Map();
      map.set(socketId, messages);
    }

    let chunks = messages.get(chunkId);
    if (!chunks) {
      chunks = { event, payload: new Array(totalChunks).fill(null) };
      messages.set(chunkId, chunks);
    }

    if (!chunks.payload[chunkIndex]) {
      chunks.payload[chunkIndex] = payload;
    }
  };

  function* flushPackets(socketId: number): Generator<{ event: PacketEvent; data: Buffer }> {
    const messages = map.get(socketId);
    if (!messages) return;

    while (true) {
      const earliest = expectedSeqMap.get(socketId);
      const chunks = messages.get(earliest);

      // 還沒收到或是還沒收齊
      if (!chunks) break;
      if (!chunks.payload.every((c) => c !== null)) break;

      // 收齊了，組合並移除
      yield { event: chunks.event, data: Buffer.concat(chunks.payload) };
      messages.delete(earliest);
      expectedSeqMap.use(socketId);
    }
  }

  return { addPacket, flushPackets };
};

/**
 * 建立重組器，用於將接收到的 chunk 重組成完整訊息
 */
function createReassembler() {
  const reassemblerMap = createReassemblerMap();

  function* processPacket(packet: Buffer): Generator<{ socketId: number; event: PacketEvent; data: Buffer }> {
    const { header, payload } = decodePacket(packet);
    reassemblerMap.addPacket(header, payload);

    for (const { event, data } of reassemblerMap.flushPackets(header.socketId)) {
      yield { socketId: header.socketId, event, data };
    }
  }

  return { processPacket };
}

export { createChunker, createReassembler };
