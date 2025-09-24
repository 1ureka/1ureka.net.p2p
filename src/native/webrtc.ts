import { tryCatch } from "@/utils";
import { z } from "zod";
import { getLock, setState } from "@/store/webrtc";
import { createDataChannelSender } from "./webrtcUtils";

// 採用 Vanilla ICE， review 時請 **不准** 提議 Trickle ICE，vercel edge call 很貴
const API_BASE = "https://1ureka.vercel.app/api/webrtc";

// =================================================================
// 本地 WebRTC 處理邏輯
// =================================================================
const createConnection = () => {
  return new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  });
};

const createLocalCandidates = (peerConnection: RTCPeerConnection) => {
  setState({ log: "初始化本地 ICE Candidate 收集器中" });
  const candidates: string[] = [];

  const promise = new Promise<string[]>((resolve) => {
    peerConnection.onicecandidate = (event) => {
      const candidate = event.candidate;
      if (candidate) candidates.push(JSON.stringify(candidate.toJSON()));
      else resolve([...candidates]); // 當 candidate 為 null 時，表示 ICE 收集完成
    };
  });

  return {
    getPromise() {
      setState({ log: "收集本地 ICE Candidate 中" });
      const timeout = new Promise<string[]>((resolve) => setTimeout(() => resolve([...candidates]), 5000));
      return Promise.race([promise, timeout]);
    },
  };
};

const createLocalDescription = async (peerConnection: RTCPeerConnection, method: "createOffer" | "createAnswer") => {
  const candidates = createLocalCandidates(peerConnection);

  setState({ log: "創建本地描述中" });
  const description = await peerConnection[method]();

  setState({ log: "設置本地描述中" });
  await peerConnection.setLocalDescription(description);

  return { description: JSON.stringify(description), candidates: await candidates.getPromise() };
};

const createRemoteCandidates = async (peerConnection: RTCPeerConnection, candidates: string[]) => {
  setState({ log: `添加 ${candidates.length} 個遠端 ICE Candidate 中` });

  const result = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        return true;
      } catch {
        return false;
      }
    })
  );

  if (result.every((r) => r === false)) throw new Error(`failed to add any ICE Candidate`);
};

const createRemoteDescription = async (peerConnection: RTCPeerConnection, description: string) => {
  setState({ log: "設置遠端描述中" });
  await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(description)));
};

// =================================================================
// 交換 WebRTC 訊息邏輯
// =================================================================
const SessionBodySchema = z.object({ description: z.string(), candidates: z.array(z.string()) });
type SessionBody = z.infer<typeof SessionBodySchema>;
type Session = { code: string; type: "offer" | "answer"; body: SessionBody };

const sendSession = async (session: Session) => {
  const { code, type, body } = session;
  setState({ log: `嘗試將 ${type} 發送至信令伺服器中` });

  const res = await fetch(`${API_BASE}/${code}.${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status !== 204) throw new Error(`failed to send ${type}, status code: ${res.status}`);
};

const getSession = async (session: Omit<Session, "body">) => {
  const { code, type } = session;

  for (let attempts = 0; attempts < 20; attempts++) {
    try {
      setState({ log: `嘗試從信令伺服器取得 ${session.type} 中 (${attempts + 1}/20)` });

      const res = await fetch(`${API_BASE}/${code}.${type}`);
      if (res.status !== 200) throw new Error(`failed to get ${type}, status code: ${res.status}`);

      return SessionBodySchema.parse(await res.json());
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  throw new Error(`failed to get ${type}, reached max attempts`);
};

// =================================================================
// DataChannel 傳輸邏輯
// =================================================================
const createDataChannel = (peerConnection: RTCPeerConnection) => {
  setState({ log: "初始化 DataChannel 中" });

  const promise = new Promise<RTCDataChannel>((resolve, reject) => {
    // negotiated: true 時，只要 id 相同就能直接建立連線 (對稱寫法)，利用該機制來共用函數
    const dataChannel = peerConnection.createDataChannel("data", { negotiated: true, id: 0 });
    dataChannel.onopen = () => resolve(dataChannel);
    dataChannel.onerror = () => reject(new Error("DataChannel failed to open"));
    dataChannel.onclose = () => reject(new Error("DataChannel closed unexpectedly"));
  });

  return {
    getPromise() {
      setState({ log: "等待 DataChannel 開啟，連線建立中" });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DataChannel connection timed out")), 5000)
      );
      return Promise.race([promise, timeoutPromise]);
    },
  };
};

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

  // 設置清理函數，當 DataChannel 關閉時移除監聽器
  dataChannel.onclose = () => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };

  dataChannel.onerror = (error) => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };
};

// =================================================================
// 生命週期管理，創建與關閉
// =================================================================
const connAsHost = async (peerConnection: RTCPeerConnection, code: string) => {
  const dataChannel = createDataChannel(peerConnection);

  const localInfo = await createLocalDescription(peerConnection, "createOffer");
  await sendSession({ code, type: "offer", body: localInfo });

  const { description, candidates } = await getSession({ code, type: "answer" });
  await createRemoteDescription(peerConnection, description);
  await createRemoteCandidates(peerConnection, candidates);

  return await dataChannel.getPromise();
};

const connAsClient = async (peerConnection: RTCPeerConnection, code: string) => {
  const dataChannel = createDataChannel(peerConnection);

  const { description, candidates } = await getSession({ code, type: "offer" });
  await createRemoteDescription(peerConnection, description);
  await createRemoteCandidates(peerConnection, candidates);

  const localInfo = await createLocalDescription(peerConnection, "createAnswer");
  await sendSession({ code, type: "answer", body: localInfo });

  return await dataChannel.getPromise();
};

const ensureClosePropagation = (peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel) => {
  const close = () => {
    peerConnection.close(); // 根據 w3c ED，其是冪等，因此不需擔心重複呼叫
    // 整段代碼都不該直接呼叫 dataChannel.close()，因為 DataChannel 的生命週期應該被 PeerConnection 綁定
    setState({ status: "disconnected" });
  };

  peerConnection.onconnectionstatechange = () => {
    if (["closed", "disconnected", "failed"].includes(peerConnection.connectionState)) {
      close();
    }
  };

  dataChannel.onclose = () => close();
  dataChannel.onerror = () => close();

  return close;
};

// =================================================================
// API 入口
// =================================================================
type Role = "host" | "client";
type Code = string;

/**
 * 創建一個 唯一 的 WebRTC 連線，且 DataChannel 的生命週期會被 PeerConnection 綁定
 * @param role 主機 (host) 或 客戶端 (client)
 * @param code 用於信令伺服器的代碼，必須非空
 * @returns 成功時回傳 close 函數，失敗時會更新狀態並回傳 undefined
 */
const createWebRTC = async (role: Role, code: Code) => {
  if (getLock()) {
    setState({ error: "connection has already been established or is in progress", status: "failed" });
    return;
  }
  if (code.trim().length === 0) {
    setState({ error: "code cannot be empty", status: "failed" });
    return;
  }

  setState({ status: "connecting", history: [] });
  const peerConnection = createConnection();
  const connectFunction = role === "host" ? connAsHost : connAsClient;

  const { data: dataChannel, error } = await tryCatch(connectFunction(peerConnection, code));
  if (error) {
    setState({ error: error.message, status: "failed" });
    peerConnection.close();
    return;
  }

  const close = ensureClosePropagation(peerConnection, dataChannel);
  bindDataChannelIPC(dataChannel);
  setState({ status: "connected", log: "連線建立完成" });

  return close;
};

export { createWebRTC, type Role, type Code };
