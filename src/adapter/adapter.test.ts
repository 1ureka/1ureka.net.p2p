/* eslint-disable @typescript-eslint/no-explicit-any */

import { IPCChannel } from "@/ipc";
import { EventEmitter } from "events";
import { vi, describe, it, expect } from "vitest";
import net from "net";

type MockElectronApp = {
  ipcMain: EventEmitter;
  browserWindow: { webContents: { send: (channel: string, data: Buffer) => void } };
  setPeer: (app: MockElectronApp) => void;
};

/**
 * 建立一個模擬的 Electron App，模擬渲染進程的 WebRTC DataChannel 資料傳輸
 */
const createMockElectronApp = () => {
  const ipcMain = new EventEmitter();
  let peerApp: MockElectronApp | null = null;

  const setPeer = (app: MockElectronApp) => {
    peerApp = app;
  };

  const sendToPeer = (data: Buffer) => {
    const delay = Math.floor(Math.random() * 100); // 模擬無序傳輸
    setTimeout(() => peerApp?.ipcMain.emit(IPCChannel.FromRTC, null, data), delay);
  };

  const browserWindow = {
    webContents: {
      send: (channel: IPCChannel, data: Buffer) => {
        if (channel === IPCChannel.FromTCP) {
          sendToPeer(data);
        } else {
          // 應用中的其他 主進程與渲染進程 的通訊事件，與該 e2e 測試無關，故不處理
        }
      },
    },
  };

  return { ipcMain, browserWindow, setPeer };
};

/**
 * 建立可用於 e2e 測試的兩個模擬 Electron App
 */
const createEnvironment = async () => {
  const hostApp = createMockElectronApp();
  const clientApp = createMockElectronApp();

  hostApp.setPeer(clientApp);
  clientApp.setPeer(hostApp);

  vi.resetModules();
  vi.clearAllMocks();
  vi.doMock("electron", () => ({ ipcMain: hostApp.ipcMain, BrowserWindow: vi.fn() }));
  const { createHostAdapter } = await import("./adapter-host");

  vi.resetModules();
  vi.clearAllMocks();
  vi.doMock("electron", () => ({ ipcMain: clientApp.ipcMain, BrowserWindow: vi.fn() }));
  const { createClientAdapter } = await import("./adapter-client");

  return {
    createHostAdapter: (port: number) => createHostAdapter(hostApp.browserWindow as any, port),
    createClientAdapter: (port: number) => createClientAdapter(clientApp.browserWindow as any, port),
  };
};

describe("Adapter System Tests", () => {
  it("[e2e] [echo] [client→server]", async () => {
    const { createHostAdapter, createClientAdapter } = await createEnvironment();

    // 真實 Echo Server
    const echoServer = net.createServer((socket) => socket.on("data", (d) => socket.write(d)));
    await new Promise<void>((res) => echoServer.listen(0, res));
    const echoPort = (echoServer.address() as any).port;

    await createHostAdapter(echoPort);
    await createClientAdapter(6000);

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

    // 用於看 socket close 的 log，確保兩端 adapter 有正確關閉
    await new Promise((res) => setTimeout(res, 500));
  }, 5000);

  it("[e2e] [echo] [many sockets each sending 64KB]", async () => {
    const { createHostAdapter, createClientAdapter } = await createEnvironment();

    // 真實 Echo Server
    const echoServer = net.createServer((socket) => socket.on("data", (d) => socket.write(d)));
    await new Promise<void>((res) => echoServer.listen(0, res));
    const echoPort = (echoServer.address() as any).port;

    await createHostAdapter(echoPort);
    await createClientAdapter(6001);

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
    await new Promise((res) => setTimeout(res, 500));
  }, 5000);

  // TODO:  it("[e2e] [http] [server→client] [server 先關閉]", async () => {}, 5000);
});
