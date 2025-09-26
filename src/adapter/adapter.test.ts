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
    setTimeout(() => peerApp?.ipcMain.emit(IPCChannel.FromRTC, null, data), 50);
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
  vi.doMock("electron", () => ({ ipcMain: hostApp.ipcMain, BrowserWindow: vi.fn() }));
  const { createHostAdapter } = await import("./adapter");

  vi.resetModules();
  vi.doMock("electron", () => ({ ipcMain: clientApp.ipcMain, BrowserWindow: vi.fn() }));
  const { createClientAdapter } = await import("./adapter");

  return {
    createHostAdapter: (port: number) => createHostAdapter(hostApp.browserWindow as any, port),
    createClientAdapter: (port: number) => createClientAdapter(clientApp.browserWindow as any, port),
  };
};

describe("Adapter System Tests", () => {
  it("[e2e] [echo] [client→server] [client 先關閉]", async () => {
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

  // TODO:  it("[e2e] [echo] [server→client] [server 先關閉]", async () => {}, 5000);
});
