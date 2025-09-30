import type { PacketEvent, PacketHeader, SocketPair } from "@/adapter/packet";
import { encodePacket, decodePacket } from "@/adapter/packet";

// 協定常數定義
const MAX_PAYLOAD_SIZE = 16384; // 協定中 framing 實際用到的最大 payload 大小 (16KB)
const MAX_SEQUENCE = 65535; // 序號的最大值
const MAX_TOTAL_CHUNKS = 65535; // total_chunks 的最大值

/**
 * 同時用於 chunker 與 ressembler 的序號管理器，類似 RFC 1982 的序號比較實作
 */
const createSequenceMap = () => {
  type Value = number; // 同時代表 下一個要使用的序號(chunker) 或是 目前的最早序號(ressembler)
  const map = new Map<SocketPair, Value>();

  // 取得並遞增序號，循環使用 0 ~ MAX_SEQUENCE
  const use = (pair: SocketPair) => {
    const current = map.get(pair) || 0;
    map.set(pair, (current + 1) % (MAX_SEQUENCE + 1));
    return current;
  };

  // 取得當前序號但不遞增
  const get = (pair: SocketPair) => {
    return map.get(pair) || 0;
  };

  return { use, get };
};

/**
 * 建立 Chunker，用於將資料流切割成多個 chunk
 */
const createChunker = () => {
  type GeneratorReturnType = Generator<Buffer, void, unknown>;
  const { use } = createSequenceMap();

  /**
   * 將單個大資料流切割成多個 chunk ，每次使用時會消耗一次內部的序號 (Generator 函數)
   */
  const generate = function* (socketPair: SocketPair, event: PacketEvent, data: Buffer): GeneratorReturnType {
    const streamSeq = use(socketPair);

    // 計算需要多少個 chunk
    const chunkTotal = Math.max(1, Math.ceil(data.length / MAX_PAYLOAD_SIZE));
    if (chunkTotal > MAX_TOTAL_CHUNKS) {
      throw new Error(`Data too large: requires ${chunkTotal} chunks, maximum is ${MAX_TOTAL_CHUNKS}`);
    }

    // 生成每個 chunk
    for (let chunkIndex = 0; chunkIndex < chunkTotal; chunkIndex++) {
      const start = chunkIndex * MAX_PAYLOAD_SIZE;
      const end = Math.min(start + MAX_PAYLOAD_SIZE, data.length);
      const payload = data.subarray(start, end);

      const header: PacketHeader = { event, socketPair, streamSeq, chunkIndex, chunkTotal };
      yield encodePacket(header, payload);
    }
  };

  return { generate };
};

/**
 * 建立重組器映射，用於管理未完成的重組任務
 */
const createReassemblerMap = () => {
  // socketPair → (streamSeq → chunk 陣列，依 chunkIndex 填充，缺塊為 null)
  type RessemblerMap = Map<SocketPair, Map<number, { event: PacketEvent; payload: Array<Buffer | null> }>>;
  const map: RessemblerMap = new Map();
  const expectedSeqMap = createSequenceMap();

  const addPacket = (header: PacketHeader, payload: Buffer) => {
    const { socketPair, event, streamSeq, chunkIndex, chunkTotal } = header;

    let messages = map.get(socketPair);
    if (!messages) {
      messages = new Map();
      map.set(socketPair, messages);
    }

    let chunks = messages.get(streamSeq);
    if (!chunks) {
      chunks = { event, payload: new Array(chunkTotal).fill(null) };
      messages.set(streamSeq, chunks);
    }

    if (!chunks.payload[chunkIndex]) {
      chunks.payload[chunkIndex] = payload;
    }
  };

  function* flushPackets(socketPair: SocketPair): Generator<{ event: PacketEvent; data: Buffer }> {
    const messages = map.get(socketPair);
    if (!messages) return;

    while (true) {
      const earliest = expectedSeqMap.get(socketPair);
      const chunks = messages.get(earliest);

      // 還沒收到或是還沒收齊
      if (!chunks) break;
      if (!chunks.payload.every((c) => c !== null)) break;

      // 收齊了，組合並移除
      yield { event: chunks.event, data: Buffer.concat(chunks.payload) };
      messages.delete(earliest);
      expectedSeqMap.use(socketPair);
    }
  }

  return { addPacket, flushPackets };
};

/**
 * 建立重組器，用於將接收到的 packet 重組成原本的資料流
 */
function createReassembler() {
  const reassemblerMap = createReassemblerMap();

  function* processPacket(packet: Buffer): Generator<{ pair: SocketPair; event: PacketEvent; data: Buffer }> {
    const { header, payload } = decodePacket(packet);
    reassemblerMap.addPacket(header, payload);

    for (const { event, data } of reassemblerMap.flushPackets(header.socketPair)) {
      yield { pair: header.socketPair, event, data };
    }
  }

  return { processPacket };
}

export { createChunker, createReassembler };
