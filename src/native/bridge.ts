// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "./bridgeReport";
import { checkLock, createConnectionPool, tryConnect } from "./bridgeUtils";
import { createChunker, createReassembler, PacketEvent } from "./packet";

// 注意
// 1. 一個 Electron App 只能有一個 Bridge (Host 或 Client)，已透過 lock 機制實作
// 2. 一個 Electron App 只會有一個 BrowserWindow，已透過關閉視窗就等同關閉 App 的方式實作
// 3. 只要 createBridge 成功，該應用就不會提供關閉功能，若要關閉會透過關閉 Electron App 的方式
// (因此對於成功後的資源清理，不需要特別處理，因為關閉 App 就會自動清理)

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
  const reassembler = createReassembler();

  /** 當無法取得閒置連線時的處理 */
  function handlePoolMax(socketId: number) {
    reportError({ message: `No available TCP socket for new socket ${socketId}` });
  }

  // ==================== 處理來自多 socket 與 WebRTC 的雙向溝通 ====================

  function handleConnection(socket: net.Socket, socketId: number) {
    reportLog({ message: `New socket ${socketId} connected.` });
    const { splitPayload } = createChunker(socketId);

    socket.on("data", (chunk) => {
      // TODO: tryCatch
      for (const packet of splitPayload(PacketEvent.DATA, chunk)) {
        win.webContents.send("bridge.data.tcp", packet);
      }
    });

    socket.on("close", () => {
      // TODO: tryCatch
      for (const packet of splitPayload(PacketEvent.CLOSE, Buffer.alloc(0))) {
        win.webContents.send("bridge.data.tcp", packet);
      }

      releaseSocket(socketId);
      reportWarn({ message: `TCP socket closed by local server for socket ${socketId}` });
    });

    // error 由 connectionPool 處理， connectionPool 會在錯誤時 destroy 因此會觸發 close
  }

  ipcMain.on("bridge.data.rtc", (_, buffer: Buffer) => {
    // TODO: tryCatch
    const msg = reassembler.processPacket(Buffer.from(buffer));
    if (!msg) return;

    const { socketId, event, data } = msg;
    const { status, socket } = getSocket(socketId);

    if (!socket) {
      return handlePoolMax(socketId);
    }

    if (status === "MISS") {
      handleConnection(socket, socketId);
    }

    if (event === PacketEvent.DATA && socket.writable) {
      socket.write(data);
    }

    if (event === PacketEvent.CLOSE) {
      socket.destroy();
      reportLog({ message: `TCP socket closed by remote client for socket ${socketId}` });
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
  const reassembler = createReassembler();

  server.on("error", (error) => {
    reportStatus("failed");
    reportError({ message: `TCP server listen error on port ${port}`, data: { error } });
    server.close();
    reassembler.cleanup();
  });

  server.on("listening", () => {
    reportStatus("connected");
    reportLog({ message: `Connected to TCP Proxy server at localhost:${port}` });
  });

  // ==================== 處理來自多 socket 與 WebRTC 的雙向溝通 ====================

  const clientSockets = new Map<number, net.Socket>();
  let socketCount = 0;

  server.on("connection", (socket) => {
    const socketId = socketCount++;
    if (socketId > 65535) {
      reportError({ message: `Exceeded maximum socket ID limit of 65535` });
      return socket.destroy(); // 超過 socket_id 最大值，拒絕連線
    }

    const { splitPayload } = createChunker(socketId);
    clientSockets.set(socketId, socket);

    socket.on("error", () => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對方 (Host)
      reportWarn({ message: `TCP socket for socket ${socketId} encountered an error and closing` });
    });

    socket.on("data", (chunk) => {
      // TODO: tryCatch
      for (const packet of splitPayload(PacketEvent.DATA, chunk)) {
        win.webContents.send("bridge.data.tcp", packet);
      }
    });

    socket.on("close", () => {
      // TODO: tryCatch
      for (const packet of splitPayload(PacketEvent.CLOSE, Buffer.alloc(0))) {
        win.webContents.send("bridge.data.tcp", packet);
      }

      clientSockets.delete(socketId);
      reportWarn({ message: `TCP socket closed by remote server for socket ${socketId}` });
    });
  });

  ipcMain.on("bridge.data.rtc", (_e, buffer: Buffer) => {
    // TODO: tryCatch
    const msg = reassembler.processPacket(Buffer.from(buffer));
    if (!msg) return;

    const { socketId, event, data } = msg;
    const socket = clientSockets.get(socketId);
    if (!socket) return;

    if (event === PacketEvent.DATA && socket.writable) {
      socket.write(data);
    }

    if (event === PacketEvent.CLOSE) {
      socket.destroy();
      reportLog({ message: `TCP socket closed by remote server for socket ${socketId}` });
    }
  });
}

export { createHostBridge, createClientBridge };
