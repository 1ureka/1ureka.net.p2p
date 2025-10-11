import net from "net";
import { createReporter, reportSockets, reportRules } from "@/adapter-state/report";
import { PacketEvent } from "@/adapter/packet";
import { createChunker, createReassembler } from "@/adapter/framing";
import { SocketPairMap, stringifySocketPair, type SocketPair, classifyAddress } from "@/adapter/ip";

/**
 * Host 端的四種訪問權限設置
 */
type Rules = { allowIPv4Local: boolean; allowIPv6Local: boolean; allowLAN: boolean };

/**
 * 建立 Host 端的 Adapter (連接到本地的 TCP 伺服器)
 */
function createHostAdapter(send: (packet: Buffer) => void) {
  const { reportLog, reportWarn, reportError } = createReporter("Host");

  const chunker = createChunker();
  const reassembler = createReassembler();
  const sockets = new SocketPairMap<net.Socket>();
  const socketPromises = new SocketPairMap<Promise<void>>();
  const rules = { allowIPv4Local: true, allowIPv6Local: false, allowLAN: false };

  /**
   * 檢查 SocketPair 是否符合當前的訪問規則
   */
  const checkRules = (socketPair: SocketPair) => {
    const ruleMap = {
      ipv4local: { key: "allowIPv4Local", label: "IPv4 local" },
      ipv6local: { key: "allowIPv6Local", label: "IPv6 local" },
      lan: { key: "allowLAN", label: "LAN" },
    } as const;

    const type = classifyAddress(socketPair.dstAddr);
    const pairStr = stringifySocketPair(socketPair);

    if (type === "invalid") {
      reportWarn({ message: `Invalid IP address for socket ${pairStr}. Rejecting CONNECT request.` });
      return false;
    }

    if (type === "external") {
      reportWarn({ message: `External address detected for socket ${pairStr}. Rejecting CONNECT request.` });
      return false;
    }

    const rule = ruleMap[type];
    if (rule && !rules[rule.key]) {
      reportWarn({ message: `${rule.label} connection not allowed for socket ${pairStr}. Rejecting CONNECT request.` });
      return false;
    }

    return true;
  };

  /**
   * 處理來自 RTC 端的 CONNECT 封包，建立對應的 TCP socket 連線
   */
  const handleConnectFromRTC = (socketPair: SocketPair) => {
    if (sockets.has(socketPair)) {
      reportWarn({
        message: `Socket ${stringifySocketPair(socketPair)} already exists. Ignoring duplicate CONNECT request.`,
      });
      for (const packet of chunker.generate(socketPair, PacketEvent.CLOSE, Buffer.alloc(0))) {
        send(packet);
      }
      return;
    }

    if (!checkRules(socketPair)) {
      for (const packet of chunker.generate(socketPair, PacketEvent.CLOSE, Buffer.alloc(0))) {
        send(packet);
      }
      return;
    }

    const socket = net.connect(socketPair.dstPort, socketPair.dstAddr);
    socketPromises.set(
      socketPair,
      new Promise((res) => {
        socket.on("connect", () => {
          res();
          reportSockets({ type: "add", pair: socketPair });
        });
      })
    );

    sockets.set(socketPair, socket);

    const handleErrorFromLocal = (error: Error) => {
      socket.destroy(); // 觸發 close 事件，close 事件會通知對端
      reportWarn({
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
          message: `Failed to process data for socket ${stringifySocketPair(socketPair)}.`,
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
          message: `Failed to process close event for socket ${stringifySocketPair(socketPair)}.`,
          data: error,
        });
      }

      socket.off("close", handleCloseFromLocal);
      socket.off("error", handleErrorFromLocal);
      socket.off("data", handleDataFromLocal);
      sockets.delete(socketPair);
      socketPromises.delete(socketPair);

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
        if (event === PacketEvent.CONNECT) {
          handleConnectFromRTC(pair);
        }
        if (event === PacketEvent.DATA) {
          const promise = socketPromises.get(pair);

          if (!promise) {
            const pairStr = stringifySocketPair(pair);
            reportWarn({ message: `Cannot process DATA packet: socket ${pairStr} not found.` });
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
      reportError({ message: "Failed to process incoming RTC packet.", data: error });
      return;
    }
  };

  // ------------------------------------------------------------------------------

  const handleChangeRules = (_: unknown, configs: Rules) => {
    Object.assign(rules, configs);
    reportRules({ type: "set", rules: { ...rules } });
    reportLog({ message: "Host access rules updated successfully.", data: { rules } });
    return true;
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

  return { handlePacketFromRTC, handleClose, handleChangeRules };
}

export { createHostAdapter, type Rules };
