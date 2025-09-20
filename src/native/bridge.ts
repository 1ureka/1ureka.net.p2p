import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "./log";

// 一個 Electron app 內只會有一個橋接，且該橋接要馬未連接，要馬已連接

let lock = false; // 理論上根本用不到，因為只有我一個人在寫

/**
 * 建立 TCP 與 WebRTC 之間的橋接，將資料在兩者之間轉發 (對稱部分的邏輯)
 */
function createBridge(socket: net.Socket, win: BrowserWindow) {
  const report = createReporter("Bridge", win);
  if (lock) {
    report({ level: "warn", message: "Bridge is already established, ignoring duplicate attempt" });
    return;
  } else {
    report({ level: "info", message: "Binding TCP <-> WebRTC" });
    lock = true;
  }

  // disconnect events
  socket.on("error", (error) => {
    report({ level: "error", message: "TCP socket error", data: { error } });
    socket.destroy();
    win.webContents.send("bridge.disconnect");
    ipcMain.removeAllListeners("bridge.data.fromRTC");
    lock = false;
  });

  socket.on("close", () => {
    report({ level: "info", message: "TCP socket closed" });
    win.webContents.send("bridge.disconnect");
    ipcMain.removeAllListeners("bridge.data.fromRTC");
    lock = false;
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
  const socket = net.connect(port, "127.0.0.1").setTimeout(1000);
  const address = `localhost:${port}`;

  socket.on("timeout", () => {
    report({ level: "error", message: `Connection to TCP server at ${address} timed out` });
    socket.destroy();
    win.webContents.send("bridge.fail");
  });

  socket.on("error", (error) => {
    report({ level: "error", message: `Error connecting to TCP server at ${address}`, data: { error } });
    socket.destroy();
    win.webContents.send("bridge.fail");
  });

  socket.on("connect", () => {
    report({ level: "info", message: `Connected to TCP server at ${address}` });
    createBridge(socket, win);
    win.webContents.send("bridge.connect");
  });
}

/**
 * 作為 Client 的使用者用的橋接
 */
export function createClientBridge(win: BrowserWindow, port: number) {
  const report = createReporter("Client", win);

  const server = net.createServer((socket) => {
    report({ level: "info", message: "Client connected to TCP proxy" });
    win.webContents.send("bridge.connect");
    createBridge(socket, win);
  });

  server.listen(port, "127.0.0.1", () => {
    report({ level: "info", message: `Listening on localhost:${port}` });
  });

  server.on("error", (error) => {
    report({ level: "error", message: `TCP server listen error on port ${port}`, data: { error } });
    server.close();
    win.webContents.send("bridge.fail");
  });
}
