import { controller } from "@/transport/store";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { joinSession, pollingSession, sendSignal } from "@/transport/session-utils";

const GETHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，加入既有會話
 */
const createClientSession = async (sessionId: string) => {
  const { reportLog, reportError, setStatus, onceAborted } = controller;

  // 1. 加入既有會話
  try {
    if (!setStatus("joining")) return;

    if (controller.aborted) throw new Error("Session creation aborted before starting");
    await joinSession(sessionId);
    if (controller.aborted) throw new Error("Session aborted after joining session");
  } catch (error) {
    reportError({ message: "Failed to join session", data: error });
    setStatus("failed");
    return;
  }

  // 2. 不須等待加入事件
  setStatus("waiting");

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // 3. 交換信令
  try {
    setStatus("signaling");

    for await (const { signal } of pollingSession(sessionId, "offer")) {
      if (controller.aborted) throw new Error("Session aborted while waiting for offer");
      reportLog({ message: "Waiting for host's offer..." });
      if (signal.offer) {
        await setRemote(signal.offer.sdp, signal.offer.candidate);
        break;
      }
    }

    if (controller.aborted) throw new Error("Session aborted after setting remote offer");
    const { description, candidates } = await getLocal("createAnswer", GETHER_CANDIDATE_TIMEOUT);
    await sendSignal(sessionId, { type: "answer", sdp: description, candidate: candidates });
    if (controller.aborted) throw new Error("Session aborted after sending answer");
  } catch (error) {
    reportError({ message: "Error occurred during signaling exchange", data: error });
    setStatus("failed");
    close();
    return;
  }

  // 4. 等待 DataChannel 開啟
  try {
    if (controller.aborted) throw new Error("Session aborted before DataChannel establishment");
    const dataChannel = await getDataChannel(WAIT_DATA_CHANNEL_TIMEOUT);
    bindDataChannelIPC(dataChannel);
    if (controller.aborted) throw new Error("Session aborted after DataChannel established");

    setStatus("connected");
    reportLog({ message: "DataChannel established successfully" });

    onceAborted(() => {
      reportLog({ message: "Session aborted and connection closed" });
      setStatus("failed");
      close();
    });
  } catch (error) {
    reportError({ message: "Failed to open DataChannel", data: error });
    setStatus("failed");
    close();
    return;
  }
};

export { createClientSession };
