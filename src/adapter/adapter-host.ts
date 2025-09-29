import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "@/adapter/report";
import { checkLock, tryConnect } from "@/adapter/adapter-utils";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { IPCChannel } from "@/ipc";

/**
 * 建立 Host 端的 Adapter (連接到本地的 TCP 伺服器)
 */
async function createHostAdapter(win: BrowserWindow, port: number) {
  if (!checkLock(win)) return;

  const { reportLog, reportWarn, reportError, reportStatus } = createReporter("Host", win);
  reportLog({ message: `Creating host adapter to TCP server at localhost:${port}` });
  reportStatus("connecting");

  if (!(await tryConnect(win, port))) return;

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets: Map<number, net.Socket> = new Map();

  /**
   * 處理來自 RTC 端的 CONNECT 封包，建立對應的 TCP socket 連線
   */
  const handleConnectFromRTC = (socketId: number) => {
    if (sockets.has(socketId)) {
      reportWarn({ message: `Socket ${socketId} already exists, ignoring CONNECT request.` });
      return;
    }

    const socket = net.connect(port, "::", () => {
      reportLog({ message: `TCP socket connected for socket ${socketId}` });
    });

    sockets.set(socketId, socket);

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
        reportError({ message: `Error processing data for socket ${socketId}`, data: { error } });
      }
    };

    const handleCloseFromLocal = () => {
      try {
        for (const packet of chunker.generate(socketId, PacketEvent.CLOSE, Buffer.alloc(0))) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({ message: `Error processing close for socket ${socketId}`, data: { error } });
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
    reportLog({ message: `TCP socket closed by remote client for socket ${socketId}` });
  };

  /**
   * 處理來自 RTC 端的封包，並根據封包內容進行相應的處理
   */
  const handlePacketFromRTC = (_: unknown, buffer: Buffer) => {
    try {
      for (const { socketId, event, data } of reassembler.processPacket(buffer)) {
        if (event === PacketEvent.CONNECT) {
          handleConnectFromRTC(socketId);
        }
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

  ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
}

export { createHostAdapter };
