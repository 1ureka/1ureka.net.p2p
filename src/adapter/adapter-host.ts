import net from "net";
import { createReporter, reportSockets } from "@/adapter-state/report";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { SocketPairMap, stringifySocketPair, type SocketPair } from "@/adapter/ip";

/**
 * 建立 Host 端的 Adapter (連接到本地的 TCP 伺服器)
 */
function createHostAdapter(send: (packet: Buffer) => void) {
  const { reportLog, reportWarn, reportError } = createReporter("Host");

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets = new SocketPairMap<net.Socket>();
  const socketPromises = new SocketPairMap<Promise<void>>();

  /**
   * 處理來自 RTC 端的 CONNECT 封包，建立對應的 TCP socket 連線
   */
  const handleConnectFromRTC = (socketPair: SocketPair) => {
    if (sockets.has(socketPair)) {
      reportWarn({
        message: `Socket ${stringifySocketPair(socketPair)} already exists, ignoring CONNECT request.`,
      });
      return;
    }

    const socket = net.connect(socketPair.dstPort, socketPair.dstAddr);
    socketPromises.set(
      socketPair,
      new Promise((res) => {
        socket.on("connect", () => {
          res();
          reportLog({ message: `TCP socket connected for socket ${stringifySocketPair(socketPair)}` });
          reportSockets(socketPair, "add");
        });
      })
    );

    sockets.set(socketPair, socket);

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
          send(packet);
        }
      } catch (error) {
        reportError({
          message: `Error processing data for socket ${stringifySocketPair(socketPair)}`,
          data: { error },
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
          message: `Error processing close for socket ${stringifySocketPair(socketPair)}`,
          data: { error },
        });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketPair);
      socketPromises.delete(socketPair);

      reportLog({ message: `TCP socket closed for socket ${stringifySocketPair(socketPair)}` });
      reportSockets(socketPair, "del");
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
      reportLog({ message: `TCP socket closed by remote client for socket ${stringifySocketPair(socketPair)}` });
    };

    try {
      for (const { pair, event, data } of reassembler.processPacket(Buffer.from(buffer))) {
        if (event === PacketEvent.CONNECT) {
          handleConnectFromRTC(pair);
        }
        if (event === PacketEvent.DATA) {
          const promise = socketPromises.get(pair);

          if (!promise) {
            const pairStr = stringifySocketPair(pair);
            reportError({ message: `Socket ${pairStr} does not exist, cannot process incoming DATA packet.` });
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

  // ------------------------------------------------------------------------------

  // TODO: 管理動態 rules
  const handleCreateRule = (_: unknown, _rule: unknown) => {
    reportLog({ message: "Create rule - Not implemented yet" });
  };

  const handleRemoveRule = (_: unknown, _ruleId: unknown) => {
    reportLog({ message: "Remove rule - Not implemented yet" });
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
  };

  return { handlePacketFromRTC, handleClose, handleCreateRule, handleRemoveRule };
}

export { createHostAdapter };
