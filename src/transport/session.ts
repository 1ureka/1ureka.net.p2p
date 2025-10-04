import { reportLog, reportError } from "@/transport/store";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { createSession, joinSession, pollingSession, sendSignal } from "./session-utils";

const GETHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，支援創建新會話或加入既有會話
 */
const startSession = async (sessionId?: string) => {
  let responseId: string | null = null;

  try {
    if (!sessionId) {
      // 1. 創建新會話並等待加入事件
      const { id } = await createSession();
      responseId = id;
      for await (const session of pollingSession(id, "join")) {
        reportLog({ message: "Waiting for client to join session..." });
        if (session.status === "joined") break;
      }
    } else {
      // 1. 加入既有會話
      const { id } = await joinSession(sessionId);
      responseId = id;
    }
  } catch (error) {
    reportError({ message: "Failed to create or join session", data: error });
    return null;
  }

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  try {
    if (!sessionId) {
      // 2. 收集本地資訊並發送 offer
      const { description, candidates } = await getLocal("createOffer", GETHER_CANDIDATE_TIMEOUT);
      await sendSignal(responseId, { type: "offer", sdp: description, candidate: candidates });

      // 3. 等待對方的 answer
      for await (const { signal } of pollingSession(responseId, "answer")) {
        reportLog({ message: "Waiting for client's answer..." });
        if (signal.answer) {
          await setRemote(signal.answer.sdp, signal.answer.candidate);
          break;
        }
      }
    } else {
      // 2. 等待對方的 offer
      for await (const { signal } of pollingSession(responseId, "offer")) {
        reportLog({ message: "Waiting for host's offer..." });
        if (signal.offer) {
          await setRemote(signal.offer.sdp, signal.offer.candidate);
          break;
        }
      }
      // 3. 收集本地資訊並發送 answer
      const { description, candidates } = await getLocal("createAnswer", GETHER_CANDIDATE_TIMEOUT);
      await sendSignal(responseId, { type: "answer", sdp: description, candidate: candidates });
    }
  } catch (error) {
    reportError({ message: "Failed to establish WebRTC connection", data: error });
    close();
    return null;
  }

  try {
    // 4. 等待 DataChannel 開啟
    const dataChannel = await getDataChannel(WAIT_DATA_CHANNEL_TIMEOUT);
    bindDataChannelIPC(dataChannel);
    reportLog({ message: "DataChannel established successfully" });
  } catch (error) {
    reportError({ message: "Failed to open DataChannel", data: error });
    close();
    return null;
  }

  return { endSession: () => close() };
};

export { startSession };
