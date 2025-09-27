import { getLock, setState } from "@/transport/store";
import { getSession, sendSession } from "@/transport/signaling";
import { createPeerConnection } from "@/transport/transport-pc";
import { bindDataChannelIPC } from "@/transport/transport-ipc";

/**
 * WebRTC 參數類型
 */
type Role = "host" | "client";
type WebRTCParams = {
  role: Role;
  code: string;
  timeoutLocalCandidate?: number; // 收集 ice candidate 的最大等待時間（毫秒）
  timeoutDataChannel?: number; // 等待 DataChannel 開啟的最大時間（毫秒）
  signalingMaxAttempts?: number; // 信令伺服器請求的最大重試次數
};

/**
 * 創建一個 唯一 的 WebRTC 連線，且 DataChannel 的生命週期會被 PeerConnection 綁定
 */
const createTransport = async (params: WebRTCParams) => {
  const { role, code } = params;
  const { timeoutLocalCandidate = 2000, timeoutDataChannel = 5000, signalingMaxAttempts = 20 } = params;

  // 開始前檢查

  if (getLock()) {
    setState({ status: "failed", error: "Connection has already been established or is in progress" });
    return;
  }
  if (code.trim().length === 0) {
    setState({ status: "failed", error: "Code cannot be empty" });
    return;
  }

  setState({ status: "connecting", history: [] });
  const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();

  // setup WebRTC connection

  try {
    if (role === "host") {
      const localInfo = await getLocal("createOffer", timeoutLocalCandidate);
      await sendSession({ code, type: "offer", body: localInfo });

      const attempts = signalingMaxAttempts;
      const { description, candidates } = await getSession({ code, type: "answer", attempts });
      await setRemote(description, candidates);
    }

    if (role === "client") {
      const attempts = signalingMaxAttempts;
      const { description, candidates } = await getSession({ code, type: "offer", attempts });
      await setRemote(description, candidates);

      const localInfo = await getLocal("createAnswer", timeoutLocalCandidate);
      await sendSession({ code, type: "answer", body: localInfo });
    }
  } catch (error) {
    if (error instanceof Error) {
      setState({ status: "failed", error: error.message });
    } else {
      setState({ status: "failed", error: "An unknown error occurred during WebRTC setup" });
    }
    close();
    return;
  }

  // wait for DataChannel to open

  try {
    const dataChannel = await getDataChannel(timeoutDataChannel);
    bindDataChannelIPC(dataChannel);

    setState({ status: "connected", log: "Connection established successfully" });
    return close;
  } catch (error) {
    if (error instanceof Error) {
      setState({ status: "failed", error: error.message });
    } else {
      setState({ status: "failed", error: "An unknown error occurred during WebRTC connection establishment" });
    }
    close();
    return;
  }
};

export { createTransport, type Role };
