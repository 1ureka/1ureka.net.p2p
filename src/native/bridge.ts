import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "./log";

// TODO: 歷史遺留，因為之前是前後端分離，現在改成Electron後這些可以改成設定檔，讓使用者可以自訂

const TCP_host = "127.0.0.1";
const TCP_port = 8080;

// TODO: 設計更健壯的架構，使不管是 TCP 與 RTC 哪方先建立、斷線、重連都能正常運作

/**
 * 建立 TCP 與 WebRTC 之間的橋接，將資料在兩者之間轉發 (對稱部分的邏輯)
 */
function createBridge(tcpSocket: net.Socket, win: BrowserWindow) {
  const report = createReporter("Bridge", win);
  report({ level: "info", message: "Binding TCP <-> WebRTC" });

  // TCP → WebRTC
  tcpSocket.on("data", (chunk) => {
    win.webContents.send("bridge.tcp.data", chunk);
    report({ level: "info", message: `Forwarded ${chunk.length} bytes from TCP to RTC` });
  });

  tcpSocket.on("error", (err) => {
    report({ level: "error", message: "TCP error", data: { error: err.message } });
  });

  tcpSocket.on("close", () => {
    report({ level: "info", message: "TCP connection closed" });
  });

  // WebRTC → TCP
  ipcMain.on("bridge.rtc.data", (event, chunk: Buffer) => {
    tcpSocket.write(Buffer.from(chunk));
    report({ level: "info", message: `Forwarded ${chunk.length} bytes from RTC to TCP` });
  });
}

/**
 * 作為 Host 的使用者用的橋接
 */
export function createHostBridge(win: BrowserWindow) {
  const report = createReporter("Server", win);
  let retryCount = 0;

  // 建立 TCP client，連到真實 TCP server (目前先不管斷線重連)
  function connectWithRetry() {
    const tcpSocket = net.connect(TCP_port, TCP_host);

    tcpSocket.once("connect", () => {
      report({ level: "info", message: `Connected to TCP server at ${TCP_host}:${TCP_port}` });
      createBridge(tcpSocket, win);
    });

    tcpSocket.once("error", (err) => {
      retryCount++;
      setTimeout(connectWithRetry, 1000);
      if (retryCount % 10 === 0) {
        const message = `TCP connection failed, already retried ${retryCount} times.`;
        report({ level: "error", message, data: { error: err.message } });
      }
    });
  }

  connectWithRetry();
}

/**
 * 作為 Client 的使用者用的橋接
 */
export function createClientBridge(win: BrowserWindow) {
  const report = createReporter("Client", win);

  const server = net.createServer((socket) => {
    createBridge(socket, win);
  });

  server.listen(TCP_port, TCP_host, () => {
    report({ level: "info", message: `Listening on ${TCP_host}:${TCP_port}` });
  });
}
