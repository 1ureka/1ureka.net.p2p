import net from "net";
import crypto from "node:crypto";
import { IPCChannel } from "@/ipc";
import type { BrowserWindow } from "electron";

import { createReporter } from "@/adapter/report";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { SocketPairMap, stringifySocketPair, type SocketPair } from "@/adapter/ip";
import { defer, tryCatchSync } from "@/utils";

/**
 * 建立 Client 端的 Adapter (建立虛擬 TCP 伺服器讓本地的 TCP 客戶端連接)
 */
function createClientAdapter(win: BrowserWindow) {
  const { reportLog, reportError, reportConnection } = createReporter("Client");

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets = new SocketPairMap<net.Socket>();

  /**
   * 處理來自應用程式的 TCP 連線，並建立對應的封包轉送機制
   */
  const handleConnectFromLocal = (socket: net.Socket, dstAddr: string, dstPort: number) => {
    const socketPair: SocketPair = {
      srcAddr: socket.remoteAddress!, //eslint-disable-line @typescript-eslint/no-non-null-assertion
      srcPort: socket.remotePort!, //eslint-disable-line @typescript-eslint/no-non-null-assertion
      dstAddr,
      dstPort,
    };

    if (sockets.has(socketPair)) {
      reportError({ message: `Socket ${stringifySocketPair(socketPair)} already exists, closing new connection.` });
      socket.destroy();
      return;
    }

    sockets.set(socketPair, socket);
    reportLog({ message: `New socket ${stringifySocketPair(socketPair)} connected.` });
    reportConnection(socketPair, "add");

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
      reportConnection(socketPair, "del");
    };

    socket.on("close", handleCloseFromLocal);
    socket.on("error", handleErrorFromLocal);
    socket.on("data", handleDataFromLocal);
  };

  /**
   * 處理來自 RTC 端的封包，並根據封包內容進行相應的處理
   */
  const handlePacketFromRTC = (_: unknown, buffer: Buffer) => {
    const handleDataFromRTC = (socketPair: SocketPair, data: Buffer) => {
      const success = sockets.get(socketPair)?.write(data);
      if (!success) {
        return reportError({
          message: `Socket ${stringifySocketPair(socketPair)} does not exist or is not writable, cannot process incoming packet.`,
        });
      }
    };

    const handleCloseFromRTC = (socketPair: SocketPair) => {
      sockets.get(socketPair)?.destroy();
      reportLog({ message: `TCP socket closed by remote server for socket ${stringifySocketPair(socketPair)}` });
    };

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

  // ------------------------------------------------------------------------------

  /**
   * 目前在該 Adapter 上建立的所有虛擬 TCP 伺服器 (key 為 uuid，value 為 net.Server 實例)
   */
  const servers: Map<string, net.Server> = new Map();

  /**
   * 動態在該 Adapter 上根據要求建立一個虛擬 TCP 伺服器，並將接收到的連線轉送到指定的目標地址與端口
   */
  const createMapping = (map: SocketPair) => {
    const server = net.createServer();
    const { promise, resolve, reject } = defer<net.Server>();

    const local = `${map.srcAddr}:${map.srcPort}`;
    const remote = `${map.dstAddr}:${map.dstPort}`;

    const serverConnectionHandler = (socket: net.Socket) => {
      reportLog({ message: `Accepted new TCP connection from ${socket.remoteAddress}:${socket.remotePort}` });
      handleConnectFromLocal(socket, map.dstAddr, map.dstPort);
    };

    const serverListeningHandler = () => {
      resolve(server);
      reportLog({ message: `Client Adapter listening on ${local}, forwarding to ${remote}` });
    };

    const serverErrorHandler = (error: Error) => {
      reject(error);
      reportError({ message: `Client Adapter server error on ${local}`, data: { error } });

      server.off("connection", serverConnectionHandler);
      server.off("listening", serverListeningHandler);
      server.off("error", serverErrorHandler);
      tryCatchSync(() => server.close());
    };

    server.on("connection", serverConnectionHandler);
    server.on("listening", serverListeningHandler);
    server.on("error", serverErrorHandler);

    server.listen(map.srcPort, map.srcAddr);

    return promise;
  };

  /**
   * 處理建立映射的請求
   */
  const handleCreateMapping = async (_: unknown, map: SocketPair) => {
    try {
      const id = crypto.randomUUID();
      const server = await createMapping(map);
      servers.set(id, server);
      return id;
    } catch (error) {
      reportError({ message: "Error creating mapping", data: { error, map } });
    }
  };

  /**
   * 處理移除映射的請求
   */
  const handleRemoveMapping = async (_: unknown, id: string) => {
    const server = servers.get(id);
    const { promise, resolve } = defer<void>();

    if (!server) {
      return reportError({ message: `Mapping with ID ${id} does not exist.` });
    }

    server.close(() => {
      resolve();
      servers.delete(id);
      reportLog({ message: `Mapping with ID ${id} closed.` });
    });

    return promise;
  };

  // ------------------------------------------------------------------------------

  /**
   * 關閉 Adapter，釋放所有資源
   */
  const handleClose = () => {
    for (const socket of sockets.values()) {
      socket.destroy();
      socket.removeAllListeners("data");
      socket.removeAllListeners("error");
      socket.removeAllListeners("close");
    }

    for (const server of servers.values()) {
      tryCatchSync(() => server.close());
      server.removeAllListeners("connection");
      server.removeAllListeners("listening");
      server.removeAllListeners("error");
    }
  };

  return { handlePacketFromRTC, handleClose, handleCreateMapping, handleRemoveMapping };
}

export { createClientAdapter };
