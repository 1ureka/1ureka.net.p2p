import { getLock, setState } from "@/store/webrtc";
import { getSession, sendSession } from "@/native/signaling";
import { createDataChannelSender } from "@/native/webrtc-sender";
import { createWebRTCSession } from "@/native/webrtc-utils";

/**
 * WebRTC 參數類型
 */
type Role = "host" | "client";
type Code = string;

type WebRTCParams = {
  role: Role;
  code: string;
  timeoutLocalCandidate?: number; // 收集 ice candidate 的最大等待時間（毫秒）
  timeoutDataChannel?: number; // 等待 DataChannel 開啟的最大時間（毫秒）
  signalingMaxAttempts?: number; // 信令伺服器請求的最大重試次數
};

/**
 * 綁定 DataChannel 與 IPC 的雙向資料橋接
 */
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // DataChannel → IPC: 當 DataChannel 收到資料時，轉發到主程序的橋接邏輯
  dataChannel.onmessage = (event) => {
    try {
      const buffer = event.data;
      if (buffer instanceof ArrayBuffer) {
        window.electron.send("bridge.data.rtc", new Uint8Array(buffer));
      } else if (ArrayBuffer.isView(buffer)) {
        window.electron.send("bridge.data.rtc", buffer);
      } else {
        setState({ error: "Received invalid data type from DataChannel" });
      }
    } catch (error) {
      setState({ error: "Failed to process data received from DataChannel" });
    }
  };

  // IPC → DataChannel: 監聽來自主程序的資料並透過 DataChannel 發送
  const handleIPCMessage = (buffer: unknown) => {
    try {
      if (buffer instanceof ArrayBuffer) {
        sender.push(buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        sender.push(buffer as ArrayBufferView<ArrayBuffer>);
      } else {
        setState({ error: "Received invalid data type from IPC" });
      }
    } catch (error) {
      setState({ error: "Failed to send data through DataChannel" });
    }
  };

  // 註冊 IPC 監聽器
  window.electron.on("bridge.data.tcp", handleIPCMessage);

  // 設置清理函數，當 DataChannel 關閉時移除監聽器與關閉 sender
  dataChannel.onclose = () => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };

  dataChannel.onerror = (error) => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };
};

/**
 * 創建一個 唯一 的 WebRTC 連線，且 DataChannel 的生命週期會被 PeerConnection 綁定
 */
const createWebRTC = async (params: WebRTCParams) => {
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
  const { getDataChannel, getLocal, setRemote, close } = createWebRTCSession();

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

    setState({ status: "connected", log: "連線建立完成" });
    return close;
  } catch (error) {
    if (error instanceof Error) {
      setState({ status: "failed", error: error.message });
    } else {
      setState({ status: "failed", error: "An unknown error occurred during WebRTC connection establishment" });
    }
  }
};

export { createWebRTC, type Role, type Code };
