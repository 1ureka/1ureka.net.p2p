import net from "net";
import dns from "dns/promises";
import crypto from "node:crypto";
import { createReporter, reportSockets, reportMappings } from "@/adapter-state/report";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { SocketPairMap, stringifySocketPair, type SocketPair } from "@/adapter/ip";
import { defer, tryCatchSync } from "@/utils";

/**
 * 建立 Client 端的 Adapter (建立虛擬 TCP 伺服器讓本地的 TCP 客戶端連接)
 */
function createClientAdapter(send: (packet: Buffer) => void) {
  const { reportLog, reportError } = createReporter("Client");

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
      reportError({
        message: `Duplicate socket ${stringifySocketPair(socketPair)} detected. Rejecting new connection.`,
      });
      socket.destroy();
      return;
    }

    sockets.set(socketPair, socket);
    reportSockets({ type: "add", pair: socketPair });

    try {
      for (const packet of chunker.generate(socketPair, PacketEvent.CONNECT, Buffer.alloc(0))) {
        send(packet);
      }
    } catch (error) {
      reportError({
        message: `Failed to generate CONNECT packet for socket ${stringifySocketPair(socketPair)}.`,
        data: error,
      });
      socket.destroy();
      return;
    }

    const handleErrorFromLocal = (error: Error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportError({
        message: `Socket ${stringifySocketPair(socketPair)} encountered an error. Closing connection.`,
        data: error,
      });
    };

    const handleDataFromLocal = (chunk: Buffer) => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.DATA, chunk)) {
          send(packet);
        }
      } catch (error) {
        reportError({
          message: `Failed to generate DATA packets for socket ${stringifySocketPair(socketPair)}.`,
          data: error,
        });
      }
    };

    const handleCloseFromLocal = () => {
      try {
        for (const packet of chunker.generate(socketPair, PacketEvent.CLOSE, Buffer.alloc(0))) {
          send(packet);
        }
      } catch (error) {
        reportError({
          message: `Failed to generate CLOSE packet for socket ${stringifySocketPair(socketPair)}.`,
          data: error,
        });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketPair);

      reportSockets({ type: "del", pair: socketPair });
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
      sockets.get(socketPair)?.write(data);
    };

    const handleCloseFromRTC = (socketPair: SocketPair) => {
      sockets.get(socketPair)?.destroy();
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
      reportError({ message: "Failed to process incoming RTC packet.", data: error });
      return;
    }
  };

  // ------------------------------------------------------------------------------

  /**
   * 目前在該 Adapter 上建立的所有虛擬 TCP 伺服器 (key 為 uuid，value 為 net.Server 實例)
   */
  const servers: Map<string, net.Server> = new Map();
  const serverSockets: Map<string, Set<net.Socket>> = new Map();

  /**
   * 動態在該 Adapter 上根據要求建立一個虛擬 TCP 伺服器，並將接收到的連線轉送到指定的目標地址與端口
   */
  const createMapping = (id: string, map: SocketPair) => {
    const server = net.createServer();
    const { promise, resolve, reject } = defer<net.Server>();

    const local = `${map.srcAddr}:${map.srcPort}`;
    const remote = `${map.dstAddr}:${map.dstPort}`;

    const serverConnectionHandler = (socket: net.Socket) => {
      if (!serverSockets.has(id)) serverSockets.set(id, new Set());
      const sockets = serverSockets.get(id)!; /* eslint-disable-line @typescript-eslint/no-non-null-assertion */
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
      handleConnectFromLocal(socket, map.dstAddr, map.dstPort);
    };

    const serverListeningHandler = () => {
      server.off("listening", serverListeningHandler);

      resolve(server);
      reportLog({ message: `Client adapter listening on ${local}, forwarding to ${remote}.` });
    };

    const serverErrorHandler = (error: Error) => {
      server.off("connection", serverConnectionHandler);
      server.off("listening", serverListeningHandler);
      server.off("error", serverErrorHandler);
      tryCatchSync(() => server.close());

      reject(error);
      reportError({ message: `Client adapter failed to start on ${local}.`, data: error });
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
      const parsedMap: SocketPair = { ...map, dstAddr: (await dns.lookup(map.dstAddr)).address };
      const server = await createMapping(id, parsedMap);
      servers.set(id, server);
      reportMappings({ type: "add", id, map: parsedMap });
      return id;
    } catch (error) {
      reportError({ message: `Failed to create mapping for ${stringifySocketPair(map)}.`, data: error });
    }
  };

  /**
   * 處理移除映射的請求
   */
  const handleRemoveMapping = async (_: unknown, id: string) => {
    const server = servers.get(id);
    const { promise, resolve } = defer<void>();

    if (!server) {
      return reportError({ message: `Cannot remove mapping: ID ${id} not found.` });
    }

    const sockets = serverSockets.get(id);
    if (sockets) {
      for (const socket of sockets) socket.destroy();
    }

    server.close(() => {
      servers.delete(id);
      serverSockets.delete(id);
      reportLog({ message: `Mapping with ID ${id} closed.` });
      reportMappings({ type: "del", id });
      resolve();
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
