import { controller } from "@/transport/store";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { createSession, joinSession, pollingSession, sendSignal } from "./session-utils";

const GETHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，支援創建新會話或加入既有會話
 */
const startSession = async (sessionId?: string) => {
  // ----------------------------------------------------------------------
  const { reportLog, reportError, setStatus, onceAborted } = controller;
  if (!setStatus("joining")) return; // 因此若開始，status 必定是 joining
  let responseId: string | null = null;

  try {
    if (controller.aborted) throw new Error("Session creation aborted before starting");

    if (!sessionId) {
      // 1. 創建新會話並等待加入事件
      const { id } = await createSession();
      responseId = id;
      if (controller.aborted) throw new Error("Session creation aborted after creating session");
      setStatus("waiting");

      for await (const session of pollingSession(id, "join")) {
        reportLog({ message: "Waiting for client to join session..." });
        if (controller.aborted) throw new Error("Session aborted while waiting for client to join");
        if (session.status === "joined") break;
      }
    } else {
      // 1. 加入既有會話
      const { id } = await joinSession(sessionId);
      responseId = id;
      if (controller.aborted) throw new Error("Session aborted after joining session");
      setStatus("waiting");
    }
  } catch (error) {
    reportError({ message: "Failed to create or join session", data: error });
    setStatus("failed");
    return;
  }

  // ----------------------------------------------------------------------

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // ----------------------------------------------------------------------

  try {
    setStatus("signaling");
    if (controller.aborted) throw new Error("Session aborted before WebRTC negotiation");

    if (!sessionId) {
      // 2. 收集本地資訊並發送 offer
      const { description, candidates } = await getLocal("createOffer", GETHER_CANDIDATE_TIMEOUT);
      await sendSignal(responseId, { type: "offer", sdp: description, candidate: candidates });
      if (controller.aborted) throw new Error("Session aborted after sending offer");

      // 3. 等待對方的 answer
      for await (const { signal } of pollingSession(responseId, "answer")) {
        reportLog({ message: "Waiting for client's answer..." });
        if (controller.aborted) throw new Error("Session aborted while waiting for answer");
        if (signal.answer) {
          await setRemote(signal.answer.sdp, signal.answer.candidate);
          break;
        }
      }
    } else {
      // 2. 等待對方的 offer
      for await (const { signal } of pollingSession(responseId, "offer")) {
        reportLog({ message: "Waiting for host's offer..." });
        if (controller.aborted) throw new Error("Session aborted while waiting for offer");
        if (signal.offer) {
          await setRemote(signal.offer.sdp, signal.offer.candidate);
          break;
        }
      }
      // 3. 收集本地資訊並發送 answer
      const { description, candidates } = await getLocal("createAnswer", GETHER_CANDIDATE_TIMEOUT);
      await sendSignal(responseId, { type: "answer", sdp: description, candidate: candidates });
      if (controller.aborted) throw new Error("Session aborted after sending answer");
    }
  } catch (error) {
    reportError({ message: "Failed to establish WebRTC connection", data: error });
    setStatus("failed");
    close();
    return;
  }

  // ----------------------------------------------------------------------

  try {
    if (controller.aborted) throw new Error("Session aborted before DataChannel establishment");

    // 4. 等待 DataChannel 開啟
    const dataChannel = await getDataChannel(WAIT_DATA_CHANNEL_TIMEOUT);
    bindDataChannelIPC(dataChannel);
    setStatus("connected");
    reportLog({ message: "DataChannel established successfully" });

    if (controller.aborted) throw new Error("Session aborted after DataChannel established");
    onceAborted(() => {
      close();
      reportLog({ message: "Session aborted and connection closed" });
      setStatus("failed");
    });
  } catch (error) {
    reportError({ message: "Failed to open DataChannel", data: error });
    setStatus("failed");
    close();
    return;
  }
};

export { startSession };
