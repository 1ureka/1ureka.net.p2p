/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { EventEmitter } from "events";
import { vi, describe, it, expect } from "vitest";
import net from "net";

/**
 * 建立可用於 e2e 測試的環境
 */
const createEnvironment = async () => {
  const hostApp = new EventEmitter();
  const clientApp = new EventEmitter();

  vi.resetModules();
  vi.clearAllMocks();
  vi.doMock("@/adapter/report", () => ({
    createReporter: (module: string) => ({
      reportLog: vi.fn(),
      reportWarn: vi.fn(),
      reportError: vi.fn(),
      reportConnection: vi.fn(),
    }),
    clearHistory: vi.fn(),
  }));

  const { createHostAdapter } = await import("./adapter-host");
  const { createClientAdapter } = await import("./adapter-client");

  const hostAdapter = createHostAdapter((hostPacket) => {
    const delayToSimulateUnordered = Math.random() * 100;
    setTimeout(() => {
      clientApp.emit("fromRemote", hostPacket);
    }, delayToSimulateUnordered);
  });
  const clientAdapter = createClientAdapter((clientPacket) => {
    const delayToSimulateUnordered = Math.random() * 100;
    setTimeout(() => {
      hostApp.emit("fromRemote", clientPacket);
    }, delayToSimulateUnordered);
  });

  hostApp.on("fromRemote", (packet: Buffer) => hostAdapter.handlePacketFromRTC(null, packet));
  clientApp.on("fromRemote", (packet: Buffer) => clientAdapter.handlePacketFromRTC(null, packet));

  return { hostAdapter, clientAdapter };
};

describe("Adapter System Tests", () => {
  it("[e2e] [echo] [client→server]", async () => {
    const { hostAdapter, clientAdapter } = await createEnvironment();

    // 真實 Echo Server
    const echoServer = net.createServer((socket) => socket.on("data", (d) => socket.write(d)));
    await new Promise<void>((res) => echoServer.listen(0, res));
    const echoPort = (echoServer.address() as any).port;

    await clientAdapter.handleCreateMapping(null, {
      srcAddr: "127.0.0.1",
      srcPort: 6000,
      dstAddr: "127.0.0.1",
      dstPort: echoPort,
    });

    // 測試程式的 TCP client
    const tcpClient = net.connect(6000, "127.0.0.1");
    const result = await new Promise<string>((resolve, reject) => {
      tcpClient.on("error", reject);
      tcpClient.on("data", (data) => resolve(data.toString()));
      tcpClient.write("hello");
    });

    expect(result).toBe("hello");

    tcpClient.destroy();
    echoServer.close();

    hostAdapter.handleClose();
    clientAdapter.handleClose();
  }, 5000);

  it("[e2e] [echo] [many sockets each sending 64KB]", async () => {
    const { hostAdapter, clientAdapter } = await createEnvironment();

    // 真實 Echo Server
    const echoServer = net.createServer((socket) => socket.on("data", (d) => socket.write(d)));
    await new Promise<void>((res) => echoServer.listen(0, res));
    const echoPort = (echoServer.address() as any).port;

    await clientAdapter.handleCreateMapping(null, {
      srcAddr: "127.0.0.1",
      srcPort: 6001,
      dstAddr: "127.0.0.1",
      dstPort: echoPort,
    });

    // 建立一個 64KB 的測試資料
    const bigBuffer = Buffer.alloc(64 * 1024, "a");

    // 來 10 個連線，每個都送 64KB
    const totalClients = 100;
    const results = await Promise.all(
      Array.from({ length: totalClients }).map(
        (_, i) =>
          new Promise<boolean>((resolve, reject) => {
            const client = net.connect(6001, "127.0.0.1");

            client.on("error", reject);

            client.on("data", (data) => {
              const ok = data.equals(bigBuffer);
              client.destroy();
              resolve(ok);
            });

            client.write(bigBuffer);
          })
      )
    );

    // 每個連線回來的資料都要正確
    expect(results.every((r) => r)).toBe(true);
    echoServer.close();

    hostAdapter.handleClose();
    clientAdapter.handleClose();
  }, 5000);

  it("[e2e] [echo] [multiple mappings]", async () => {
    const { hostAdapter, clientAdapter } = await createEnvironment();

    // 建立兩個不同 echo server
    const echoServer1 = net.createServer((s) => s.on("data", (d) => s.write("S1:" + d)));
    const echoServer2 = net.createServer((s) => s.on("data", (d) => s.write("S2:" + d)));

    await new Promise<void>((res) => echoServer1.listen(0, res));
    await new Promise<void>((res) => echoServer2.listen(0, res));

    const echoPort1 = (echoServer1.address() as any).port;
    const echoPort2 = (echoServer2.address() as any).port;

    await clientAdapter.handleCreateMapping(null, {
      srcAddr: "127.0.0.1",
      srcPort: 6003,
      dstAddr: "127.0.0.1",
      dstPort: echoPort1,
    });
    await clientAdapter.handleCreateMapping(null, {
      srcAddr: "127.0.0.1",
      srcPort: 6004,
      dstAddr: "127.0.0.1",
      dstPort: echoPort2,
    });

    const res1 = await new Promise<string>((resolve) => {
      const c = net.connect(6003, "127.0.0.1");
      c.once("data", (d) => resolve(d.toString()));
      c.write("hello");
    });

    const res2 = await new Promise<string>((resolve) => {
      const c = net.connect(6004, "127.0.0.1");
      c.once("data", (d) => resolve(d.toString()));
      c.write("world");
    });

    expect(res1).toBe("S1:hello");
    expect(res2).toBe("S2:world");

    echoServer1.close();
    echoServer2.close();

    hostAdapter.handleClose();
    clientAdapter.handleClose();
  }, 5000);
});
