import { EventEmitter } from "events";
import { vi, describe, it, expect } from "vitest";
import net from "net";

class MockElectronApp {
  peerApp?: MockElectronApp;
  ipcMain: EventEmitter;

  constructor(ipcMain: EventEmitter) {
    this.ipcMain = ipcMain;
  }

  private sendRTC(data: Buffer) {
    setTimeout(() => {
      this.peerApp?.receiveRTC("bridge.data.rtc", data);
    }, 100);
  }

  private receiveRTC(channel: string, data: Buffer) {
    this.ipcMain.emit(channel, null, data);
  }

  webContents = {
    send: (channel: string, data: Buffer) => {
      if (channel === "bridge.data.tcp") {
        this.sendRTC(data);
      }
      // 剩下的 channel 通常用於顯示 UI、log 等等，不在測試範圍內
    },
  };
}

// TODO: 增加反向，也就是 server 先關閉
describe("Bridge end-to-end", () => {
  it("test", async () => {
    const IpcMain_H = new EventEmitter();
    const IpcMain_C = new EventEmitter();

    vi.resetModules();
    vi.doMock("electron", () => ({ ipcMain: IpcMain_H, BrowserWindow: vi.fn() }));
    const { createHostBridge } = await import("../native/bridge");

    vi.resetModules();
    vi.doMock("electron", () => ({ ipcMain: IpcMain_C, BrowserWindow: vi.fn() }));
    const { createClientBridge } = await import("../native/bridge");

    const BrowserWindow_H = new MockElectronApp(IpcMain_H as any);
    const BrowserWindow_C = new MockElectronApp(IpcMain_C as any);
    BrowserWindow_H.peerApp = BrowserWindow_C;
    BrowserWindow_C.peerApp = BrowserWindow_H;

    // 真實 Echo Server
    const echoServer = net.createServer((socket) => socket.on("data", (d) => socket.write(d)));
    await new Promise<void>((res) => echoServer.listen(0, res));
    const echoPort = (echoServer.address() as any).port;

    // 啟動 bridges
    await createHostBridge(BrowserWindow_H as any, echoPort);
    await createClientBridge(BrowserWindow_C as any, 6000);

    // 測試程式的 TCP client → 連到 clientBridge fake server
    const tcpClient = net.connect(6000, "127.0.0.1");
    const result = await new Promise<string>((resolve, reject) => {
      tcpClient.on("error", reject);
      tcpClient.on("data", (data) => resolve(data.toString()));
      tcpClient.write("hello");
    });

    expect(result).toBe("hello");

    tcpClient.destroy();
    echoServer.close();

    await new Promise((res) => setTimeout(res, 1000));
  }, 5000);
});
