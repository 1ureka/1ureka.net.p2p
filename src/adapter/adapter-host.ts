import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { createReporter } from "@/adapter/report";
import { checkLock } from "@/adapter/adapter-utils";
import { PacketEvent, type SocketPair } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { IPCChannel } from "@/ipc";

/**
 * 建立 Host 端的 Adapter (連接到本地的 TCP 伺服器)
 */
async function createHostAdapter(win: BrowserWindow) {
  if (!checkLock(win)) return;

  const { reportLog, reportWarn, reportError, reportStatus } = createReporter("Host", win);
  reportStatus("connecting");

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets: Map<SocketPair, net.Socket> = new Map();
  const socketPromises: Map<SocketPair, Promise<void>> = new Map();

  /**
   * 處理來自 RTC 端的 CONNECT 封包，建立對應的 TCP socket 連線
   */
  const handleConnectFromRTC = (socketPair: SocketPair) => {
    if (sockets.has(socketPair)) {
      reportWarn({ message: `Socket (${socketPair}) already exists, ignoring CONNECT request.` });
      return;
    }

    const socket = net.connect(socketPair.dstPort, socketPair.dstAddr);
    socketPromises.set(
      socketPair,
      new Promise((res) => {
        socket.on("connect", () => {
          res();
          reportLog({ message: `TCP socket connected for socket (${socketPair})` });
        });
      })
    );

    sockets.set(socketPair, socket);

    const handleErrorFromLocal = (error: Error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportError({
        message: `TCP socket for socket (${socketPair}) encountered an error and closing`,
        data: { error },
      });
    };

    const handleDataFromLocal = (chunk: Buffer) => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.DATA, chunk)) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({ message: `Error processing data for socket (${socketPair})`, data: { error } });
      }
    };

    const handleCloseFromLocal = () => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.CLOSE, Buffer.alloc(0))) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({ message: `Error processing close for socket (${socketPair})`, data: { error } });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketPair);
      reportLog({ message: `TCP socket closed for socket (${socketPair})` });
    };

    socket.on("close", handleCloseFromLocal);
    socket.on("error", handleErrorFromLocal);
    socket.on("data", handleDataFromLocal);
  };

  /**
   * 處理來自 RTC 端的 DATA 封包，將資料寫入對應的 TCP socket
   */
  const handleDataFromRTC = (socketPair: SocketPair, data: Buffer) => {
    const success = sockets.get(socketPair)?.write(data);
    if (!success) {
      const message = `Socket (${socketPair}) does not exist or is not writable, cannot process incoming packet.`;
      return reportError({ message });
    }
  };

  /**
   * 處理來自 RTC 端的 CLOSE 封包，將對應的 TCP socket 關閉
   */
  const handleCloseFromRTC = (socketPair: SocketPair) => {
    sockets.get(socketPair)?.destroy();
    reportLog({ message: `TCP socket closed by remote client for socket (${socketPair})` });
  };

  /**
   * 處理來自 RTC 端的封包，並根據封包內容進行相應的處理
   */
  const handlePacketFromRTC = (_: unknown, buffer: Buffer) => {
    try {
      for (const { pair, event, data } of reassembler.processPacket(Buffer.from(buffer))) {
        if (event === PacketEvent.CONNECT) {
          handleConnectFromRTC(pair);
        }
        if (event === PacketEvent.DATA) {
          const promise = socketPromises.get(pair);
          if (!promise) {
            reportError({ message: `Socket (${pair}) does not exist, cannot process incoming DATA packet.` });
          } else {
            // 利用 then 會順序執行的特性，保持 TCP 資料順序
            promise.then(() => handleDataFromRTC(pair, data));
          }
        }
        if (event === PacketEvent.CLOSE) {
          handleCloseFromRTC(pair);
        }
      }
    } catch (error) {
      reportError({ message: "Error processing incoming RTC packet", data: { error } });
      return;
    }
  };

  ipcMain.removeAllListeners(IPCChannel.FromRTC);
  ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
}

export { createHostAdapter };
