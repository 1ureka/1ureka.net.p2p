import * as ipaddr from "ipaddr.js";

// Header 常數定義
const HEADER_SIZE = 43; // 43 bytes 固定 header 大小
const MAX_PACKET_SIZE = 65535; // 封包總大小上限
const MAX_PAYLOAD_SIZE = MAX_PACKET_SIZE - HEADER_SIZE; // 65492

// 事件類型
enum PacketEvent {
  DATA = 0,
  CLOSE = 1,
  CONNECT = 2,
}

type SocketPair = {
  srcAddr: string; // 來源 IP 位址 (IPv4 或 IPv6)
  srcPort: number; // 來源 Port (0-65535)
  dstAddr: string; // 目標 IP 位址 (IPv4 或 IPv6)
  dstPort: number; // 目標 Port (0-65535)
};

/**
 * 將 SocketPair 轉換為字串，方便用作 Map (避免物件引用問題)或是日誌輸出
 */
const socketPairToString = (pair: SocketPair): string => {
  return `(${pair.srcAddr}:${pair.srcPort} => ${pair.dstAddr}:${pair.dstPort})`;
};

// 封包 Header 結構，格式詳見 README.md
interface PacketHeader {
  event: PacketEvent; // 事件類型 (0=DATA, 1=CLOSE, 2=CONNECT, …)
  socketPair: SocketPair; // 來源與目標的 IP 與 Port
  streamSeq: number; // 該封包所屬的資料流序號 (0-65535)
  chunkIndex: number; // 該封包在所在資料流的指標 (0-65535)
  chunkTotal: number; // 該資料流被切了多少 (1-65535)
}

/**
 * 解析並轉換 IP 地址為 16 字節的 Buffer
 */
const createIPAddress = (ip: string): Buffer => {
  try {
    // 解析並驗證 IP 地址
    const addr = ipaddr.process(ip);

    // 將 IPv4 轉換為 IPv6 映射格式，IPv6 保持原樣
    let ipv6Addr: ipaddr.IPv6;
    if (addr.kind() === "ipv4") {
      const ipv4 = addr as ipaddr.IPv4;
      ipv6Addr = ipv4.toIPv4MappedAddress();
    } else {
      ipv6Addr = addr as ipaddr.IPv6;
    }

    // 轉換為 16 字節的 Buffer
    return Buffer.from(ipv6Addr.toByteArray());
  } catch (error) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
};

/**
 * 解析並轉換 Buffer 為可以丟給 net.connect 的 IP 字串
 */
const parseIPAddress = (buffer: Buffer): string => {
  return ipaddr.fromByteArray(Array.from(buffer)).toString();
};

/**
 * 將 Header 和 payload 編碼成一個完整的封包
 */
function encodePacket(header: PacketHeader, payload: Buffer): Buffer {
  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload size ${payload.length} exceeds maximum ${MAX_PAYLOAD_SIZE}`);
  }

  if (header.chunkTotal < 1) {
    throw new Error("chunkTotal must be >= 1");
  }

  const packet = Buffer.allocUnsafe(HEADER_SIZE + payload.length);
  let offset = 0;

  // [0] event (1 byte)
  packet.writeUInt8(header.event, offset);
  offset += 1;
  // [1-16] src_addr (16 bytes)
  createIPAddress(header.socketPair.srcAddr).copy(packet, offset);
  offset += 16;
  // [17-18] src_port (2 bytes)
  packet.writeUInt16BE(header.socketPair.srcPort, offset);
  offset += 2;
  // [19-34] dst_addr (16 bytes)
  createIPAddress(header.socketPair.dstAddr).copy(packet, offset);
  offset += 16;
  // [35-36] dst_port (2 bytes)
  packet.writeUInt16BE(header.socketPair.dstPort, offset);
  offset += 2;
  // [37-38] stream_seq (2 bytes)
  packet.writeUInt16BE(header.streamSeq, offset);
  offset += 2;
  // [39-40] chunk_index (2 bytes)
  packet.writeUInt16BE(header.chunkIndex, offset);
  offset += 2;
  // [41-42] chunk_total (2 bytes)
  packet.writeUInt16BE(header.chunkTotal, offset);
  offset += 2;
  // [43-] payload
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
  const event = packet.readUInt8(offset);
  offset += 1;
  // [1-16] src_addr
  const srcAddr = parseIPAddress(packet.subarray(offset, offset + 16));
  offset += 16;
  // [17-18] src_port
  const srcPort = packet.readUInt16BE(offset);
  offset += 2;
  // [19-34] dst_addr
  const dstAddr = parseIPAddress(packet.subarray(offset, offset + 16));
  offset += 16;
  // [35-36] dst_port
  const dstPort = packet.readUInt16BE(offset);
  offset += 2;
  // [37-38] stream_seq
  const streamSeq = packet.readUInt16BE(offset);
  offset += 2;
  // [39-40] chunk_index
  const chunkIndex = packet.readUInt16BE(offset);
  offset += 2;
  // [41-42] chunk_total
  const chunkTotal = packet.readUInt16BE(offset);
  offset += 2;
  // [43-] payload
  const payload = packet.subarray(offset);

  const header: PacketHeader = {
    event,
    socketPair: { srcAddr, srcPort, dstAddr, dstPort },
    streamSeq,
    chunkIndex,
    chunkTotal,
  };

  return { header, payload };
}

export { encodePacket, decodePacket, socketPairToString, PacketEvent, PacketHeader, SocketPair };
