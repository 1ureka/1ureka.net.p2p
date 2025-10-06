import { controller } from "@/transport/store";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { createSession, pollingSession, sendSignal } from "@/transport/session-utils";

const GETHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，創建新會話
 */
const createHostSession = async () => {
  const { reportLog, reportError, setStatus, onceAborted } = controller;
  let sessionId: string | null = null;

  // 1. 創建新會話
  try {
    if (!setStatus("joining")) return;

    if (controller.aborted) throw new Error("Session creation aborted before starting");
    const { id } = await createSession();
    sessionId = id;
    if (controller.aborted) throw new Error("Session creation aborted after creating session");
  } catch (error) {
    reportError({ message: "Failed to create session", data: error });
    setStatus("failed");
    return;
  }

  // 2. 等待加入事件
  try {
    setStatus("waiting");

    for await (const session of pollingSession(sessionId, "join")) {
      if (controller.aborted) throw new Error("Session aborted while waiting for client to join");
      reportLog({ message: "Waiting for client to join session..." });
      if (session.status === "joined") break;
    }
  } catch (error) {
    reportError({ message: "Failed to wait for client to join session", data: error });
    setStatus("failed");
    return;
  }

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // 3. 交換信令
  try {
    setStatus("signaling");

    if (controller.aborted) throw new Error("Session aborted before WebRTC negotiation");
    const { description, candidates } = await getLocal("createOffer", GETHER_CANDIDATE_TIMEOUT);
    await sendSignal(sessionId, { type: "offer", sdp: description, candidate: candidates });
    if (controller.aborted) throw new Error("Session aborted after sending offer");

    for await (const { signal } of pollingSession(sessionId, "answer")) {
      if (controller.aborted) throw new Error("Session aborted while waiting for answer");
      reportLog({ message: "Waiting for client's answer..." });
      if (signal.answer) {
        await setRemote(signal.answer.sdp, signal.answer.candidate);
        break;
      }
    }
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

export { createHostSession };
