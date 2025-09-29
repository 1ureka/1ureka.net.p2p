import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "@/adapter/report";
import { tryListen } from "@/adapter/adapter-utils";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { IPCChannel } from "@/ipc";

/**
 * 建立 Client 端的 Adapter (建立一個虛擬 TCP 伺服器讓本地的 TCP 客戶端連接)
 */
async function createClientAdapter(win: BrowserWindow, port: number) {
  const { reportLog, reportError, reportStatus } = createReporter("Client", win);
  reportLog({ message: `Connecting to TCP Proxy server at localhost:${port}` });
  reportStatus("connecting");

  const server = await tryListen(win, port);
  if (!server) return;

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets = new Map<number, net.Socket>();
  let socketCount = 0;

  /**
   * 處理來自應用程式的 TCP 連線，並建立對應的封包轉送機制
   */
  const handleConnectFromLocal = (socket: net.Socket) => {
    const socketId = ++socketCount % 65536;
    reportLog({ message: `New socket ${socketId} connected.` });
    sockets.set(socketId, socket);

    try {
      for (const packet of chunker.generate(socketId, PacketEvent.CONNECT, Buffer.alloc(0))) {
        win.webContents.send(IPCChannel.FromTCP, packet);
      }
    } catch (error) {
      reportError({ message: `Error generating CONNECT packet for socket ${socketId}`, data: { error } });
      socket.destroy();
      return;
    }

    const handleErrorFromLocal = (error: Error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportError({
        message: `TCP socket for socket ${socketId} encountered an error and closing`,
        data: { error },
      });
    };

    const handleDataFromLocal = (chunk: Buffer) => {
      try {
        for (const packet of chunker.generate(socketId, PacketEvent.DATA, chunk)) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({ message: `Error generating DATA packets for socket ${socketId}`, data: { error } });
      }
    };

    const handleCloseFromLocal = () => {
      try {
        for (const packet of chunker.generate(socketId, PacketEvent.CLOSE, Buffer.alloc(0))) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({ message: `Error generating CLOSE packet for socket ${socketId}`, data: { error } });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketId);
      reportLog({ message: `TCP socket closed for socket ${socketId}` });
    };

    socket.on("close", handleCloseFromLocal);
    socket.on("error", handleErrorFromLocal);
    socket.on("data", handleDataFromLocal);
  };

  /**
   * 處理來自 RTC 端的 DATA 封包，將資料寫入對應的 TCP socket
   */
  const handleDataFromRTC = (socketId: number, data: Buffer) => {
    const success = sockets.get(socketId)?.write(data);
    if (!success) {
      const message = `Socket ${socketId} does not exist or is not writable, cannot process incoming packet.`;
      return reportError({ message });
    }
  };

  /**
   * 處理來自 RTC 端的 CLOSE 封包，將對應的 TCP socket 關閉
   */
  const handleCloseFromRTC = (socketId: number) => {
    sockets.get(socketId)?.destroy();
    reportLog({ message: `TCP socket closed by remote server for socket ${socketId}` });
  };

  /**
   * 處理來自 RTC 端的封包，並根據封包內容進行相應的處理
   */
  const handlePacketFromRTC = (_: unknown, buffer: Buffer) => {
    try {
      for (const { socketId, event, data } of reassembler.processPacket(buffer)) {
        if (event === PacketEvent.DATA) {
          handleDataFromRTC(socketId, data);
        }
        if (event === PacketEvent.CLOSE) {
          handleCloseFromRTC(socketId);
        }
      }
    } catch (error) {
      reportError({ message: "Error processing incoming RTC packet", data: { error } });
      return;
    }
  };

  server.on("connection", handleConnectFromLocal);
  ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
}

export { createClientAdapter };
