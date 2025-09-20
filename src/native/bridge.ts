// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createStore } from "zustand/vanilla";
import { createReporter } from "./log";

// 一個 Electron app 內只會有一個橋接，且該橋接要馬未連接，要馬已連接

export type BridgeStatus = "disconnected" | "connected" | "failed" | "connecting";

type State = {
  status: BridgeStatus;
  setStatus: (win: BrowserWindow, status: State["status"]) => void;
};

const store = createStore<State>((set, get) => ({
  status: "disconnected",
  setStatus: (win, status) => {
    const prev = get().status;
    if (prev === status) return;
    set({ status });
    win.webContents.send(`bridge.status`, status);
  },
}));

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";
const setStatus = (win: BrowserWindow, status: State["status"]) => store.getState().setStatus(win, status);

/**
 * 建立 TCP 與 WebRTC 之間的橋接，將資料在兩者之間轉發 (對稱部分的邏輯)
 */
function createBridge(socket: net.Socket, win: BrowserWindow) {
  const report = createReporter("Bridge", win);

  // disconnect events
  socket.on("error", (error) => {
    report({ level: "error", message: "TCP socket error", data: { error } });
    socket.destroy();
    setStatus(win, "disconnected");
    ipcMain.removeAllListeners("bridge.data.fromRTC");
  });

  socket.on("close", () => {
    report({ level: "info", message: "TCP socket closed" });
    setStatus(win, "disconnected");
    ipcMain.removeAllListeners("bridge.data.fromRTC");
  });

  // TCP → WebRTC (renderer)
  socket.on("data", (chunk) => {
    win.webContents.send("bridge.data.fromTCP", chunk);
    report({ level: "info", message: `Forwarded ${chunk.length} bytes from TCP to RTC` });
  });

  // WebRTC (renderer) → TCP
  ipcMain.on("bridge.data.fromRTC", (event, chunk: Buffer) => {
    if (socket.writable) {
      socket.write(Buffer.from(chunk));
      report({ level: "info", message: `Forwarded ${chunk.length} bytes from RTC to TCP` });
    }
  });
}

/**
 * 作為 Host 的使用者用的橋接
 */
export function createHostBridge(win: BrowserWindow, port: number) {
  const report = createReporter("Server", win);

  if (getLock()) {
    report({ level: "warn", message: "Bridge is already established or connecting, ignoring duplicate attempt" });
    return;
  }

  setStatus(win, "connecting");
  const socket = net.connect(port, "127.0.0.1").setTimeout(1000);
  const address = `localhost:${port}`;

  socket.on("timeout", () => {
    report({ level: "error", message: `Connection to TCP server at ${address} timed out` });
    socket.destroy();
    setStatus(win, "failed");
  });

  socket.on("error", (error) => {
    report({ level: "error", message: `Error connecting to TCP server at ${address}`, data: { error } });
    socket.destroy();
    setStatus(win, "failed");
  });

  socket.on("connect", () => {
    report({ level: "info", message: `Connected to TCP server at ${address}` });
    createBridge(socket, win);
    setStatus(win, "connected");
  });
}

/**
 * 作為 Client 的使用者用的橋接
 */
export function createClientBridge(win: BrowserWindow, port: number) {
  const report = createReporter("Client", win);

  const server = net.createServer((socket) => {
    report({ level: "info", message: "Client connected to TCP proxy" });
    setStatus(win, "connected");
    createBridge(socket, win);
  });

  server.listen(port, "127.0.0.1", () => {
    report({ level: "info", message: `Listening on localhost:${port}` });
  });

  server.on("error", (error) => {
    report({ level: "error", message: `TCP server listen error on port ${port}`, data: { error } });
    server.close();
    setStatus(win, "failed");
  });
}
