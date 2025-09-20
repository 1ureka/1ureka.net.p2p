import net from "net";

interface ClientStats {
  received: number;
  acksSent: number;
  bytesReceived: number;
  packetSizes: { small: number; medium: number; large: number };
}

class TestClient {
  private socket: net.Socket | null = null;
  private stats: ClientStats = {
    received: 0,
    acksSent: 0,
    bytesReceived: 0,
    packetSizes: { small: 0, medium: 0, large: 0 },
  };
  private buffer: Buffer = Buffer.alloc(0);
  private host = "127.0.0.1";
  private port = 8080;

  connect() {
    this.socket = net.connect(this.port, this.host, () => {
      console.log(`[TestClient] Connected to game server at ${this.host}:${this.port}`);
      this.startStatsReporting();
    });

    this.socket.on("data", (data) => this.handleData(data));
    this.socket.on("close", () => this.handleDisconnection());
    this.socket.on("error", (err) => console.error(`[TestClient] Connection error:`, err.message));
  }

  private handleData(data: Buffer) {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.processPackets();
  }

  private processPackets() {
    while (this.buffer.length >= 4) {
      // 讀取序列號
      const sequenceId = this.buffer.readUInt32BE(0);

      // 確保有足夠的資料讀取封包頭
      if (this.buffer.length < 20) {
        // 4 bytes seq + 16 bytes header
        break;
      }

      // 讀取封包大小（跳過序列號）
      const packetSize = this.buffer.readUInt32BE(4);
      const totalSize = 4 + packetSize; // seq + packet

      // 檢查是否有完整封包
      if (this.buffer.length < totalSize) {
        break;
      }

      // 提取完整封包
      const packet = this.buffer.subarray(4, totalSize); // 不包含序列號
      this.buffer = this.buffer.subarray(totalSize);

      // 處理封包
      this.processPacket(sequenceId, packet);
    }
  }

  private processPacket(sequenceId: number, packet: Buffer) {
    this.stats.received++;
    this.stats.bytesReceived += packet.length;

    // 分析封包類型（從header讀取）
    if (packet.length >= 16) {
      const packetType = packet.subarray(8, 16).toString("utf8").replace(/\0/g, "");

      switch (packetType) {
        case "SMALL":
          this.stats.packetSizes.small++;
          break;
        case "MEDIUM":
          this.stats.packetSizes.medium++;
          break;
        case "LARGE":
          this.stats.packetSizes.large++;
          break;
      }
    }

    // 發送 ACK
    this.sendAck(sequenceId);
  }

  private sendAck(sequenceId: number) {
    if (!this.socket || this.socket.destroyed) return;

    const ackBuffer = Buffer.alloc(4);
    ackBuffer.writeUInt32BE(sequenceId, 0);

    this.socket.write(ackBuffer);
    this.stats.acksSent++;
  }

  private handleDisconnection() {
    console.log("[TestClient] Disconnected from game server");
    this.printFinalStats();
  }

  private startStatsReporting() {
    setInterval(() => {
      this.printStats();
    }, 5000);
  }

  private printStats() {
    console.log("===== Client Stats =====");
    console.log(`Received: ${this.stats.received} packets`);
    console.log(`ACKs sent: ${this.stats.acksSent}`);
    console.log(`Bytes received: ${(this.stats.bytesReceived / 1024).toFixed(2)} KB`);
    console.log(`Packet breakdown:`);
    console.log(`  Small (32B): ${this.stats.packetSizes.small}`);
    console.log(`  Medium (1KB): ${this.stats.packetSizes.medium}`);
    console.log(`  Large (64KB): ${this.stats.packetSizes.large}`);

    const throughput = this.stats.bytesReceived / 1024 / 5; // KB/s over 5 second interval
    console.log(`Throughput: ${throughput.toFixed(2)} KB/s`);
    console.log("========================");
  }

  private printFinalStats() {
    console.log("\n===== Final Client Stats =====");
    console.log(`Total packets received: ${this.stats.received}`);
    console.log(`Total ACKs sent: ${this.stats.acksSent}`);
    console.log(`Total bytes received: ${(this.stats.bytesReceived / 1024).toFixed(2)} KB`);
    console.log(`Final packet breakdown:`);
    console.log(`  Small packets: ${this.stats.packetSizes.small}`);
    console.log(`  Medium packets: ${this.stats.packetSizes.medium}`);
    console.log(`  Large packets: ${this.stats.packetSizes.large}`);
    console.log("==============================");
  }

  disconnect() {
    if (this.socket) {
      this.socket.end();
    }
  }
}

export { TestClient };
