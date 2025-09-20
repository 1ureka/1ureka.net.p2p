import net from "net";

interface PacketStats {
  sent: number;
  acked: number;
  rtts: number[];
}

interface ClientConnection {
  socket: net.Socket;
  stats: PacketStats;
  sequenceId: number;
  pendingPackets: Map<number, number>; // sequenceId -> timestamp
}

class TestServer {
  private server: net.Server;
  private clients: Map<net.Socket, ClientConnection> = new Map();
  private port: number = 8080;

  constructor() {
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`[TestServer] Listening on port ${this.port}`);
      this.startStatsReporting();
    });
  }

  private handleConnection(socket: net.Socket) {
    console.log(`[TestServer] Client connected: ${socket.remoteAddress}`);

    const clientConnection: ClientConnection = {
      socket,
      stats: { sent: 0, acked: 0, rtts: [] },
      sequenceId: 0,
      pendingPackets: new Map(),
    };

    this.clients.set(socket, clientConnection);

    // 開始發送混合封包
    this.startPacketGeneration(clientConnection);

    socket.on("data", (data) => this.handleAck(clientConnection, data));
    socket.on("close", () => this.handleDisconnection(socket));
    socket.on("error", (err) => console.error(`[TestServer] Socket error:`, err.message));
  }

  private startPacketGeneration(client: ClientConnection) {
    // 小封包 (32 bytes / 20ms)
    const smallPacketInterval = setInterval(() => {
      if (client.socket.destroyed) {
        clearInterval(smallPacketInterval);
        return;
      }
      this.sendPacket(client, this.createPacket(32, "SMALL"));
    }, 20);

    // 中封包 (1 KB / 1s)
    const mediumPacketInterval = setInterval(() => {
      if (client.socket.destroyed) {
        clearInterval(mediumPacketInterval);
        return;
      }
      this.sendPacket(client, this.createPacket(1024, "MEDIUM"));
    }, 1000);

    // 大封包 (64 KB / 10s)
    const largePacketInterval = setInterval(() => {
      if (client.socket.destroyed) {
        clearInterval(largePacketInterval);
        return;
      }
      this.sendPacket(client, this.createPacket(64 * 1024, "LARGE"));
    }, 10000);

    // 清理定時器
    client.socket.on("close", () => {
      clearInterval(smallPacketInterval);
      clearInterval(mediumPacketInterval);
      clearInterval(largePacketInterval);
    });
  }

  private createPacket(size: number, type: string): Buffer {
    const header = Buffer.alloc(16);
    header.writeUInt32BE(size, 0); // packet size
    // 使用較小的時間戳值，只保留低位 32 位
    header.writeUInt32BE(Date.now() & 0xffffffff, 4); // timestamp (truncated to 32-bit)
    header.write(type, 8, 8, "utf8"); // packet type

    const payload = Buffer.alloc(Math.max(0, size - 16));
    payload.fill(Math.floor(Math.random() * 256));

    return Buffer.concat([header, payload]);
  }

  private sendPacket(client: ClientConnection, packet: Buffer) {
    const sequenceId = client.sequenceId++;
    const timestamp = Date.now() & 0xffffffff; // 保持與 header 中時間戳格式一致

    // 在封包前加上序列號
    const seqBuffer = Buffer.alloc(4);
    seqBuffer.writeUInt32BE(sequenceId, 0);
    const finalPacket = Buffer.concat([seqBuffer, packet]);

    client.pendingPackets.set(sequenceId, timestamp);
    client.stats.sent++;

    client.socket.write(finalPacket);
  }

  private handleAck(client: ClientConnection, data: Buffer) {
    if (data.length < 4) return;

    const ackSequenceId = data.readUInt32BE(0);
    const sendTime = client.pendingPackets.get(ackSequenceId);

    if (sendTime !== undefined) {
      const currentTime = Date.now() & 0xffffffff;
      // 處理 32 位時間戳可能的溢出問題
      let rtt = currentTime - sendTime;
      if (rtt < 0) {
        // 如果發生溢出，重新計算
        rtt = 0x100000000 + currentTime - sendTime;
      }
      client.stats.acked++;
      client.stats.rtts.push(rtt);
      client.pendingPackets.delete(ackSequenceId);

      // 限制 RTT 陣列大小
      if (client.stats.rtts.length > 1000) {
        client.stats.rtts = client.stats.rtts.slice(-500);
      }
    }
  }

  private handleDisconnection(socket: net.Socket) {
    console.log(`[TestServer] Client disconnected: ${socket.remoteAddress}`);
    this.clients.delete(socket);
  }

  private startStatsReporting() {
    setInterval(() => {
      this.printStats();
    }, 5000);
  }

  private printStats() {
    console.log("===== Stats =====");

    if (this.clients.size === 0) {
      console.log("No clients connected");
    } else {
      let totalSent = 0;
      let totalAcked = 0;
      let allRtts: number[] = [];

      for (const client of this.clients.values()) {
        totalSent += client.stats.sent;
        totalAcked += client.stats.acked;
        allRtts.push(...client.stats.rtts);
      }

      const lossRate = totalSent > 0 ? ((totalSent - totalAcked) / totalSent) * 100 : 0;
      const avgRtt = allRtts.length > 0 ? allRtts.reduce((a, b) => a + b, 0) / allRtts.length : 0;
      const maxRtt = allRtts.length > 0 ? Math.max(...allRtts) : 0;

      console.log(`Sent: ${totalSent}, Acked: ${totalAcked}, LossRate: ${lossRate.toFixed(2)}%`);
      console.log(`RTT avg: ${avgRtt.toFixed(1)} ms, max: ${maxRtt} ms`);
      console.log(`Connected clients: ${this.clients.size}`);
    }

    console.log("=================");
  }
}

export { TestServer };
