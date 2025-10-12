import { reportStatus, reportLog, reportError, onceAborted, getAborted } from "@/transport-state/report";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";
import { bindDataChannelTraffic } from "@/transport/transport-traffic";
import { joinSession, pollingSession, sendSignal } from "@/transport/session-utils";
import { handleStartClientAdapter, handleStopAdapter } from "@/adapter-state/handlers";

const GATHER_CANDIDATE_TIMEOUT = 2000; // 收集 ice candidate 的最大等待時間（毫秒）
const WAIT_DATA_CHANNEL_TIMEOUT = 5000; // 等待 DataChannel 開啟的最大時間（毫秒）

/**
 * 啟動 P2P 會話連線，加入既有會話
 */
const createClientSession = async (sessionId: string) => {
  if (!reportStatus("joining")) return;

  // 0. 啟動 adapter
  try {
    await handleStartClientAdapter();
  } catch (error) {
    reportError({ message: "Failed to start adapter.", data: error });
    reportStatus("failed");
    return;
  }

  // 1. 加入既有會話
  try {
    if (getAborted()) throw new Error("Session creation aborted.");
    await joinSession(sessionId);
    if (getAborted()) throw new Error("Session aborted after joining.");
  } catch (error) {
    await handleStopAdapter();
    reportError({ message: "Failed to join session.", data: error });
    reportStatus("failed");
    return;
  }

  // 2. 不須等待加入事件
  reportStatus("waiting");

  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // 3. 交換信令
  try {
    reportStatus("signaling");

    for await (const { signal } of pollingSession(sessionId, "offer")) {
      if (getAborted()) throw new Error("Session aborted while waiting for offer.");
      reportLog({ message: "Waiting for offer from host..." });
      if (signal.offer) {
        await setRemote(signal.offer.sdp, signal.offer.candidate);
        break;
      }
    }

    if (getAborted()) throw new Error("Session aborted after setting remote offer.");
    const { description, candidates } = await getLocal("createAnswer", GATHER_CANDIDATE_TIMEOUT);
    await sendSignal(sessionId, { type: "answer", sdp: description, candidate: candidates });
    if (getAborted()) throw new Error("Session aborted after sending answer.");
  } catch (error) {
    await handleStopAdapter();
    reportError({ message: "Failed to complete signaling exchange.", data: error });
    reportStatus("failed");
    close();
    return;
  }

  // 4. 等待 DataChannel 開啟
  try {
    if (getAborted()) throw new Error("Session aborted before DataChannel establishment.");
    const dataChannel = await getDataChannel(WAIT_DATA_CHANNEL_TIMEOUT);
    bindDataChannelTraffic(dataChannel);
    bindDataChannelIPC(dataChannel);
    if (getAborted()) throw new Error("Session aborted after DataChannel established.");

    onceAborted(async () => {
      await handleStopAdapter();
      reportLog({ message: "Session aborted and connection closed." });
      reportStatus("failed");
      close();
    });

    reportLog({ message: "DataChannel established successfully." });
    reportStatus("connected");
  } catch (error) {
    await handleStopAdapter();
    reportError({ message: "Failed to establish DataChannel connection.", data: error });
    reportStatus("failed");
    close();
    return;
  }
};

export { createClientSession };
