import * as ipaddr from "ipaddr.js";

// Header 常數定義
const HEADER_SIZE = 45; // 45 bytes 固定 header 大小
const MAX_PAYLOAD_SIZE = 65490; // 該協定最大可承受的 payload 大小 (65535 - HEADER_SIZE)

// 事件類型
enum PacketEvent {
  DATA = 0,
  CLOSE = 1,
  CONNECT = 2,
}

// 封包 Header 結構，格式詳見 README.md
interface PacketHeader {
  event: PacketEvent; // 事件類型 (0=DATA, 1=CLOSE, 2=CONNECT, …)
  srcAddr: string; // 來源 IP 位址 (IPv4 映射成 IPv6 格式，16 bytes)
  srcPort: number; // 來源 Port (0-65535)
  dstAddr: string; // 目標 IP 位址 (IPv4 映射成 IPv6 格式，16 bytes)
  dstPort: number; // 目標 Port (0-65535)
  chunkId: number; // 資料流片段 ID (0-65535)
  chunkIndex: number; // 本片段在訊息中的序號 (0-65535)
  totalChunks: number; // 總片段數 (1-65535)
  payloadSize: number; // 本片段資料大小 (0-65490)
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
  if (payload.length !== header.payloadSize) {
    throw new Error(`Payload size mismatch: expected ${header.payloadSize}, got ${payload.length}`);
  }

  if (header.payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload size ${header.payloadSize} exceeds maximum ${MAX_PAYLOAD_SIZE}`);
  }

  const packet = Buffer.allocUnsafe(HEADER_SIZE + payload.length);
  let offset = 0;

  // [0] event (1 byte)
  packet.writeUInt8(header.event, offset);
  offset += 1;
  // [1-16] src_addr (16 bytes)
  createIPAddress(header.srcAddr).copy(packet, offset);
  offset += 16;
  // [17-18] src_port (2 bytes)
  packet.writeUInt16BE(header.srcPort, offset);
  offset += 2;
  // [19-34] dst_addr (16 bytes)
  createIPAddress(header.dstAddr).copy(packet, offset);
  offset += 16;
  // [35-36] dst_port (2 bytes)
  packet.writeUInt16BE(header.dstPort, offset);
  offset += 2;
  // [37-38] chunk_id (2 bytes)
  packet.writeUInt16BE(header.chunkId, offset);
  offset += 2;
  // [39-40] chunk_index (2 bytes)
  packet.writeUInt16BE(header.chunkIndex, offset);
  offset += 2;
  // [41-42] total_chunks (2 bytes)
  packet.writeUInt16BE(header.totalChunks, offset);
  offset += 2;
  // [43-44] payload_size (2 bytes)
  packet.writeUInt16BE(header.payloadSize, offset);
  offset += 2;
  // [45-] payload
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
  // [37-38] chunk_id
  const chunkId = packet.readUInt16BE(offset);
  offset += 2;
  // [39-40] chunk_index
  const chunkIndex = packet.readUInt16BE(offset);
  offset += 2;
  // [41-42] total_chunks
  const totalChunks = packet.readUInt16BE(offset);
  offset += 2;
  // [43-44] payload_size
  const payloadSize = packet.readUInt16BE(offset);
  offset += 2;

  // 驗證 payload 大小
  const expectedPacketSize = HEADER_SIZE + payloadSize;
  if (packet.length !== expectedPacketSize) {
    throw new Error(`Packet size mismatch: expected ${expectedPacketSize}, got ${packet.length}`);
  }

  // [45-] payload
  const payload = packet.subarray(offset);

  const header: PacketHeader = {
    event,
    srcAddr,
    srcPort,
    dstAddr,
    dstPort,
    chunkId,
    chunkIndex,
    totalChunks,
    payloadSize,
  };

  return { header, payload };
}

export { encodePacket, decodePacket, PacketEvent, PacketHeader };
