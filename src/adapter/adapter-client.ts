import net from "net";
import { ipcMain, type BrowserWindow } from "electron";
import { IPCChannel } from "@/ipc";

import { createReporter } from "@/adapter/report";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { SocketPairMap, stringifySocketPair, type SocketPair } from "@/adapter/ip";

import { checkLock } from "@/adapter/adapter-utils";
import { defer } from "@/utils";

/**
 * 建立 Client 端的 Adapter (建立虛擬 TCP 伺服器讓本地的 TCP 客戶端連接)
 */
function createClientAdapter(win: BrowserWindow) {
  if (!checkLock(win)) return;

  const { reportLog, reportError, reportStatus } = createReporter("Client", win);
  reportStatus("connecting");

  // 以下進入 connected 狀態，因此不需考慮清理，請查閱 README.md

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets = new SocketPairMap<net.Socket>();

  /**
   * 處理來自應用程式的 TCP 連線，並建立對應的封包轉送機制
   */
  const handleConnectFromLocal = (socket: net.Socket, dstAddr: string, dstPort: number) => {
    const socketPair: SocketPair = {
      srcAddr: socket.remoteAddress!,
      srcPort: socket.remotePort!,
      dstAddr,
      dstPort,
    };

    if (sockets.has(socketPair)) {
      reportError({ message: `Socket ${stringifySocketPair(socketPair)} already exists, closing new connection.` });
      socket.destroy();
      return;
    }

    reportLog({ message: `New socket ${stringifySocketPair(socketPair)} connected.` });
    sockets.set(socketPair, socket);

    try {
      for (const packet of chunker.generate(socketPair, PacketEvent.CONNECT, Buffer.alloc(0))) {
        win.webContents.send(IPCChannel.FromTCP, packet);
      }
    } catch (error) {
      reportError({
        message: `Error generating CONNECT packet for socket ${stringifySocketPair(socketPair)}`,
        data: { error },
      });
      socket.destroy();
      return;
    }

    const handleErrorFromLocal = (error: Error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportError({
        message: `TCP socket for socket ${stringifySocketPair(socketPair)} encountered an error and closing`,
        data: { error },
      });
    };

    const handleDataFromLocal = (chunk: Buffer) => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.DATA, chunk)) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({
          message: `Error generating DATA packets for socket ${stringifySocketPair(socketPair)}`,
          data: { error },
        });
      }
    };

    const handleCloseFromLocal = () => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.CLOSE, Buffer.alloc(0))) {
          win.webContents.send(IPCChannel.FromTCP, packet);
        }
      } catch (error) {
        reportError({
          message: `Error generating CLOSE packet for socket ${stringifySocketPair(socketPair)}`,
          data: { error },
        });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketPair);
      reportLog({ message: `TCP socket closed for socket ${stringifySocketPair(socketPair)}` });
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
      return reportError({
        message: `Socket ${stringifySocketPair(socketPair)} does not exist or is not writable, cannot process incoming packet.`,
      });
    }
  };

  /**
   * 處理來自 RTC 端的 CLOSE 封包，將對應的 TCP socket 關閉
   */
  const handleCloseFromRTC = (socketPair: SocketPair) => {
    sockets.get(socketPair)?.destroy();
    reportLog({ message: `TCP socket closed by remote server for socket ${stringifySocketPair(socketPair)}` });
  };

  /**
   * 處理來自 RTC 端的封包，並根據封包內容進行相應的處理
   */
  const handlePacketFromRTC = (_: unknown, buffer: Buffer) => {
    try {
      for (const { pair, event, data } of reassembler.processPacket(Buffer.from(buffer))) {
        if (event === PacketEvent.DATA) {
          handleDataFromRTC(pair, data);
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

  /**
   * 動態在該 Adapter 上根據要求建立一個虛擬 TCP 伺服器，並將接收到的連線轉送到指定的目標地址與端口
   */
  const createMapping = (map: SocketPair) => {
    const server = net.createServer();
    const { promise, resolve, reject } = defer<() => void>();

    const serverConnectionHandler = (socket: net.Socket) => {
      reportLog({ message: `Accepted new TCP connection from ${socket.remoteAddress}:${socket.remotePort}` });
      handleConnectFromLocal(socket, map.dstAddr, map.dstPort);
    };

    const serverListeningHandler = () => {
      resolve(() => server.close());
      reportLog({
        message: `Client Adapter listening on ${map.srcAddr}:${map.srcPort}, forwarding to ${map.dstAddr}:${map.dstPort}`,
      });
    };

    const serverErrorHandler = (error: Error) => {
      reject(error);
      reportError({
        message: `Client Adapter server error on ${map.srcAddr}:${map.srcPort}`,
        data: { error },
      });

      server.off("connection", serverConnectionHandler);
      server.off("listening", serverListeningHandler);
      server.off("error", serverErrorHandler);
      server.close();
    };

    server.on("connection", serverConnectionHandler);
    server.on("listening", serverListeningHandler);
    server.on("error", serverErrorHandler);

    server.listen(map.srcPort, map.srcAddr);

    return promise;
  };

  ipcMain.removeAllListeners(IPCChannel.FromRTC);
  ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);

  return { createMapping };
}

export { createClientAdapter };
