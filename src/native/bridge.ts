// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "./bridgeReport";
import { checkLock, createConnectionPool, tryConnect } from "./bridgeUtils";

// 注意
// 1. 一個 Electron App 只能有一個 Bridge (Host 或 Client)，已透過 lock 機制實作
// 2. 一個 Electron App 只會有一個 BrowserWindow，已透過關閉視窗就等同關閉 App 的方式實作

type RTCMessage = {
  clientId: string;
  data: Buffer;
  event: "data" | "close";
};

// any TCP service ⇄1 Electron (net.connect) ⇄2 WebRTC ⇄3 remote client
// ⇄1: 連線池管理，之後會將 RTCMessage 變成帶有 header 的純 Buffer，因此也會包含封包處理
// ⇄2: 純粹轉送 Buffer (win.webContents.send, ipcMain.on)
// ⇄3: 純粹轉送 Buffer (datachannel)
// 註: any TCP service 可能是遊戲伺服器、http server等任意本地 TCP 服務
async function createHostBridge(win: BrowserWindow, port: number) {
  // ==================== 準備連線 ====================

  ipcMain.removeAllListeners("bridge.data.rtc");

  const { reportLog, reportError, reportWarn, reportStatus } = createReporter("Host", win);
  if (!checkLock(win)) return;

  reportStatus("connecting");
  reportLog({ message: `Creating host bridge to TCP server at localhost:${port}` });

  if (!(await tryConnect(win, port))) return;

  // ==================== 建立連線池 ====================

  const { getSocket, releaseSocket } = createConnectionPool(win, port);

  /** 當無法取得閒置連線時的處理 */
  function handlePoolMax(clientId: string) {
    reportError({ message: `No available TCP socket for new client ${clientId}` });
    win.webContents.send("bridge.data.tcp", { clientId, event: "error", data: Buffer.from("server busy") });
  }

  // ==================== 處理來自多 socket 與 WebRTC 的雙向溝通 ====================

  function handleConnection(socket: net.Socket, clientId: string) {
    reportLog({ message: `New client ${clientId} connected.` });

    socket.on("data", (chunk) => {
      win.webContents.send("bridge.data.tcp", { clientId, event: "data", data: chunk });
    });

    // error 由 connectionPool 處理， connectionPool 會在錯誤時 destroy 因此會觸發 close

    socket.on("close", () => {
      win.webContents.send("bridge.data.tcp", { clientId, event: "close", data: Buffer.alloc(0) });
      releaseSocket(clientId);
      reportWarn({ message: `TCP socket closed by local server for client ${clientId}` });
    });
  }

  ipcMain.on("bridge.data.rtc", (_, msg: RTCMessage) => {
    const { clientId, data, event } = msg;
    const { status, socket } = getSocket(clientId);

    if (!socket) {
      return handlePoolMax(clientId);
    }

    if (status === "MISS") {
      handleConnection(socket, clientId);
    }

    if (event === "data" && socket.writable) {
      socket.write(data);
    }

    if (event === "close") {
      socket.destroy();
      reportLog({ message: `TCP socket closed by remote client for client ${clientId}` });
    }
  });
}

// any Local app (TCP client) ⇄1  Electron (net.createServer) ⇄2 WebRTC ⇄3 remote host
// ⇄1: 收到 local 時間點就建立連線，之後會將 RTCMessage 變成帶有 header 的純 Buffer，因此也會包含封包處理
// ⇄2: 純粹轉送 Buffer (win.webContents.send, ipcMain.on)
// ⇄3: 純粹轉送 Buffer (datachannel)
// 註: any Local app (TCP client) 可能是遊戲客戶端、瀏覽器、Postman、curl、等任意與我專案無關的程式
function createClientBridge(win: BrowserWindow, port: number) {
  // ==================== 準備連線 ====================

  ipcMain.removeAllListeners("bridge.data.rtc");

  const { reportLog, reportError, reportWarn, reportStatus } = createReporter("Client", win);
  if (!checkLock(win)) return;

  reportStatus("connecting");
  reportLog({ message: `Connecting to TCP Proxy server at localhost:${port}` });

  // ==================== 連線 TCP Proxy Server ====================

  const server = net.createServer().listen(port, "127.0.0.1");

  server.on("error", (error) => {
    reportStatus("failed");
    reportError({ message: `TCP server listen error on port ${port}`, data: { error } });
    server.close();
  });

  server.on("listening", () => {
    reportStatus("connected");
    reportLog({ message: `Connected to TCP Proxy server at localhost:${port}` });
  });

  // ==================== 處理來自多 socket 與 WebRTC 的雙向溝通 ====================

  const clientSockets = new Map<string, net.Socket>();

  server.on("connection", (socket) => {
    const clientId = crypto.randomUUID();
    clientSockets.set(clientId, socket);

    socket.on("error", () => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對方 (Host)
      reportWarn({ message: `TCP socket for client ${clientId} encountered an error and closing` });
    });

    socket.on("data", (chunk) => {
      win.webContents.send("bridge.data.tcp", { clientId, data: chunk, event: "data" });
    });

    socket.on("close", () => {
      win.webContents.send("bridge.data.tcp", { clientId, data: Buffer.alloc(0), event: "close" });
      clientSockets.delete(clientId);
    });
  });

  ipcMain.on("bridge.data.rtc", (_e, msg: RTCMessage) => {
    const { clientId, data, event } = msg;

    const socket = clientSockets.get(clientId);
    if (!socket) return;

    if (event === "data" && socket.writable) {
      socket.write(data);
    }

    if (event === "close") {
      socket.destroy();
      reportLog({ message: `TCP socket closed by remote server for client ${clientId}` });
    }
  });
}

export { createHostBridge, createClientBridge };
