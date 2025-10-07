import { reportStatus, reportLog, reportError, onceAborted, getAborted } from "@/transport-state/report";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { createSession, pollingSession, sendSignal } from "@/transport/session-utils";

const GETHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，創建新會話
 */
const createHostSession = async () => {
  let sessionId: string | null = null;

  // 1. 創建新會話
  try {
    if (!reportStatus("joining")) return;

    if (getAborted()) throw new Error("Session creation aborted before starting");
    const { id } = await createSession();
    sessionId = id;
    if (getAborted()) throw new Error("Session creation aborted after creating session");
  } catch (error) {
    reportError({ message: "Failed to create session", data: error });
    reportStatus("failed");
    return;
  }

  // 2. 等待加入事件
  try {
    reportStatus("waiting");

    for await (const session of pollingSession(sessionId, "join")) {
      if (getAborted()) throw new Error("Session aborted while waiting for client to join");
      reportLog({ message: "Waiting for client to join session..." });
      if (session.status === "joined") break;
    }
  } catch (error) {
    reportError({ message: "Failed to wait for client to join session", data: error });
    reportStatus("failed");
    return;
  }

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // 3. 交換信令
  try {
    reportStatus("signaling");

    if (getAborted()) throw new Error("Session aborted before WebRTC negotiation");
    const { description, candidates } = await getLocal("createOffer", GETHER_CANDIDATE_TIMEOUT);
    await sendSignal(sessionId, { type: "offer", sdp: description, candidate: candidates });
    if (getAborted()) throw new Error("Session aborted after sending offer");

    for await (const { signal } of pollingSession(sessionId, "answer")) {
      if (getAborted()) throw new Error("Session aborted while waiting for answer");
      reportLog({ message: "Waiting for client's answer..." });
      if (signal.answer) {
        await setRemote(signal.answer.sdp, signal.answer.candidate);
        break;
      }
    }
  } catch (error) {
    reportError({ message: "Error occurred during signaling exchange", data: error });
    reportStatus("failed");
    close();
    return;
  }

  // 4. 等待 DataChannel 開啟
  try {
    if (getAborted()) throw new Error("Session aborted before DataChannel establishment");
    const dataChannel = await getDataChannel(WAIT_DATA_CHANNEL_TIMEOUT);
    bindDataChannelIPC(dataChannel);
    if (getAborted()) throw new Error("Session aborted after DataChannel established");

    reportStatus("connected");
    reportLog({ message: "DataChannel established successfully" });

    onceAborted(() => {
      reportLog({ message: "Session aborted and connection closed" });
      reportStatus("failed");
      close();
    });
  } catch (error) {
    reportError({ message: "Failed to open DataChannel", data: error });
    reportStatus("failed");
    close();
    return;
  }
};

export { createHostSession };
