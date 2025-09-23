// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "./bridgeReport";
import { checkLock, tryConnect, tryListen } from "./bridgeUtils";
import { createChunker, createReassembler, PacketEvent } from "./packet";

/**
 * 為每個 TCP socket 建立生命週期管理 (可參考 README.md)
 */
const createSocketLifecycle = (sockets: Map<number, net.Socket>, win: BrowserWindow) => {
  const { reportLog, reportError } = createReporter("Socket", win);

  const bind = (socket: net.Socket, socketId: number) => {
    reportLog({ message: `New socket ${socketId} connected.` });
    sockets.set(socketId, socket);

    const { generateChunks } = createChunker(socketId);
    for (const packet of generateChunks(PacketEvent.CONNECT, Buffer.alloc(0))) {
      win.webContents.send("bridge.data.tcp", packet);
    }

    socket.on("error", (error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportError({
        message: `TCP socket for socket ${socketId} encountered an error and closing`,
        data: { error },
      });
    });

    socket.on("data", (chunk) => {
      try {
        for (const packet of generateChunks(PacketEvent.DATA, chunk)) {
          win.webContents.send("bridge.data.tcp", packet);
        }
      } catch (error) {
        reportError({ message: `Error processing data for socket ${socketId}`, data: { error } });
      }
    });

    socket.on("close", () => {
      try {
        for (const packet of generateChunks(PacketEvent.CLOSE, Buffer.alloc(0))) {
          win.webContents.send("bridge.data.tcp", packet);
        }
      } catch (error) {
        reportError({ message: `Error processing close for socket ${socketId}`, data: { error } });
      }

      sockets.delete(socketId);
      reportLog({ message: `TCP socket closed for socket ${socketId}` });
    });
  };

  return { bind };
};

/**
 * 建立 Host 端的橋接 (連接到本地的 TCP 伺服器)
 */
async function createHostBridge(win: BrowserWindow, port: number) {
  if (!checkLock(win)) return;

  const { reportLog, reportWarn, reportError, reportStatus } = createReporter("Host", win);
  reportStatus("connecting");
  reportLog({ message: `Creating host bridge to TCP server at localhost:${port}` });

  if (!(await tryConnect(win, port))) return;

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const reassembler = createReassembler();
  const sockets: Map<number, net.Socket> = new Map();
  const socketLifecycle = createSocketLifecycle(sockets, win);

  ipcMain.removeAllListeners("bridge.data.rtc");
  ipcMain.on("bridge.data.rtc", (_, buffer: Buffer) => {
    let msg;

    try {
      msg = reassembler.processPacket(Buffer.from(buffer));
      if (!msg) return;
    } catch (error) {
      reportError({ message: "Error processing incoming RTC packet", data: { error } });
      return;
    }

    const { socketId, event, data } = msg;

    if (event === PacketEvent.CONNECT) {
      if (sockets.has(socketId)) {
        reportWarn({ message: `Socket ${socketId} already exists, ignoring CONNECT request.` });
        return;
      }

      const socket = net.connect(port, "127.0.0.1");
      socketLifecycle.bind(socket, socketId);
    }

    if (event === PacketEvent.DATA) {
      const socket = sockets.get(socketId);

      if (socket && socket.writable) {
        socket.write(data);
      } else {
        reportError({ message: `Socket ${socketId} does not exist or is not writable, cannot send DATA.` });
      }
    }

    if (event === PacketEvent.CLOSE) {
      sockets.get(socketId)?.destroy();
      reportLog({ message: `TCP socket closed by remote client for socket ${socketId}` });
    }
  });
}

/**
 * 建立 Client 端的橋接 (建立一個假 TCP 伺服器讓本地的 TCP 客戶端連接)
 */
async function createClientBridge(win: BrowserWindow, port: number) {
  if (!checkLock(win)) return;

  const { reportLog, reportError, reportStatus } = createReporter("Client", win);
  reportStatus("connecting");
  reportLog({ message: `Connecting to TCP Proxy server at localhost:${port}` });

  const server = await tryListen(win, port);
  if (!server) return;

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const reassembler = createReassembler();
  const sockets = new Map<number, net.Socket>();
  const socketLifecycle = createSocketLifecycle(sockets, win);
  let socketCount = 0;

  server.on("connection", (socket) => {
    socketLifecycle.bind(socket, ++socketCount % 65536);
  });

  ipcMain.removeAllListeners("bridge.data.rtc");
  ipcMain.on("bridge.data.rtc", (_e, buffer: Buffer) => {
    let msg;

    try {
      msg = reassembler.processPacket(Buffer.from(buffer));
      if (!msg) return;
    } catch (error) {
      reportError({ message: "Error processing incoming RTC packet", data: { error } });
      return;
    }

    const { socketId, event, data } = msg;
    const socket = sockets.get(socketId);
    if (!socket) {
      reportError({ message: `Socket ${socketId} does not exist, cannot process incoming packet.` });
      return;
    }

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
