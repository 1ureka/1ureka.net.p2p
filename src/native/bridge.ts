// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createStore } from "zustand/vanilla";

// 一個 Electron app 內只會有一個橋接，且該橋接要馬未連接，要馬已連接

type BridgeStatus = "disconnected" | "connected" | "failed" | "connecting";
type BridgeLogEntry = {
  level: "info" | "warn" | "error";
  module: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

type State = {
  status: BridgeStatus;
  history: BridgeLogEntry[];
};

const store = createStore<State>(() => ({
  status: "disconnected",
  history: [],
}));

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const createReporter = (module: string, win: BrowserWindow) => {
  const reportLog = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "info" });
  const reportError = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "error" });
  const reportWarn = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "warn" });

  const reportMethods = { info: console.log, warn: console.warn, error: console.error };

  const report = (entry: Omit<BridgeLogEntry, "timestamp" | "module">) => {
    const timestamp = Date.now();
    const logEntry: BridgeLogEntry = { ...entry, module, timestamp };

    store.setState((prev) => {
      const history = [...prev.history, logEntry].slice(-100);
      win.webContents.send("bridge.history", history);

      const { level, message, data } = logEntry;
      reportMethods[level](module, level.toUpperCase(), message, data ?? "");

      return { ...prev, history };
    });
  };

  const reportStatus = (status: BridgeStatus) => {
    store.setState((prev) => {
      if (status === prev.status) return { ...prev };
      win.webContents.send("bridge.status", status);
      return { ...prev, status };
    });
  };

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send("bridge.history", []);
  };

  return { reportLog, reportError, reportWarn, reportStatus, clearHistory };
};

/**
 * 建立 TCP 與 WebRTC 之間的橋接，將資料在兩者之間轉發 (對稱部分的邏輯)
 */
function createBridge(socket: net.Socket, win: BrowserWindow) {
  const { reportLog, reportError, reportStatus } = createReporter("Bridge", win);

  // disconnect events
  socket.on("error", (error) => {
    reportStatus("disconnected");
    reportError({ message: "TCP socket error", data: { error } });
    socket.destroy();
    ipcMain.removeAllListeners("bridge.data.fromRTC");
  });

  socket.on("close", () => {
    reportStatus("disconnected");
    reportLog({ message: "TCP socket closed" });
    ipcMain.removeAllListeners("bridge.data.fromRTC");
  });

  // TCP → WebRTC (renderer)
  socket.on("data", (chunk) => {
    win.webContents.send("bridge.data.fromTCP", chunk);
    reportLog({ message: `Forwarded ${chunk.length} bytes from TCP to RTC` });
  });

  // WebRTC (renderer) → TCP
  ipcMain.on("bridge.data.fromRTC", (event, chunk: Buffer) => {
    if (socket.writable) {
      socket.write(Buffer.from(chunk));
      reportLog({ message: `Forwarded ${chunk.length} bytes from RTC to TCP` });
    }
  });
}

/**
 * 作為 Host 的使用者用的橋接
 */
function createHostBridge(win: BrowserWindow, port: number) {
  const { reportLog, reportError, reportWarn, reportStatus, clearHistory } = createReporter("Server", win);
  clearHistory();

  if (getLock()) {
    reportStatus("failed");
    reportWarn({ message: "Bridge is already established or connecting, ignoring duplicate attempt" });
    return;
  }

  reportStatus("connecting");
  reportLog({ message: `Connecting to TCP server at localhost:${port}` });

  const socket = net.connect(port, "127.0.0.1").setTimeout(1000);
  const address = `localhost:${port}`;

  socket.on("timeout", () => {
    reportStatus("failed");
    reportError({ message: `Connection to TCP server at ${address} timed out` });
    socket.destroy();
  });

  socket.on("error", (error) => {
    reportStatus("failed");
    reportError({ message: `Error connecting to TCP server at ${address}`, data: { error } });
    socket.destroy();
  });

  socket.on("connect", () => {
    reportStatus("connected");
    reportLog({ message: `Connected to TCP server at ${address}` });
    createBridge(socket, win);
  });
}

/**
 * 作為 Client 的使用者用的橋接
 */
function createClientBridge(win: BrowserWindow, port: number) {
  const { reportLog, reportError, reportWarn, reportStatus, clearHistory } = createReporter("Client", win);
  clearHistory();

  if (getLock()) {
    reportStatus("failed");
    reportWarn({ message: "Bridge is already established or connecting, ignoring duplicate attempt" });
    return;
  }

  reportStatus("connecting");
  reportLog({ message: `Starting TCP server on localhost:${port}` });

  const server = net.createServer((socket) => {
    reportStatus("connected");
    reportLog({ message: "Client connected to TCP proxy" });
    createBridge(socket, win);
  });

  server.listen(port, "127.0.0.1", () => {
    reportLog({ message: `Listening on localhost:${port}` });
  });

  server.on("error", (error) => {
    reportStatus("failed");
    reportError({ message: `TCP server listen error on port ${port}`, data: { error } });
    server.close();
  });
}

export { createHostBridge, createClientBridge, type BridgeStatus, type BridgeLogEntry };
