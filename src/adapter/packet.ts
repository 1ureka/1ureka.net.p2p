// Header 常數定義
const HEADER_SIZE = 11; // 11 bytes 固定 header 大小
const MAX_PAYLOAD_SIZE = 65525; // 該協定最大可承受的 payload 大小 (65535 - HEADER_SIZE + 1)

// 事件類型
enum PacketEvent {
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

export { encodePacket, decodePacket, PacketEvent, PacketHeader };
