import { create } from "zustand";
import { tryCatch } from "src/utils";
import { z } from "zod";

// 採用 Vanilla ICE， review 時請 **不准** 提議 Trickle ICE，vercel edge call 很貴
const API_BASE = "https://1ureka.vercel.app/api/webrtc";

type WebRTCStore = {
  status: "connected" | "disconnected" | "connecting";
  connect: (role: "host" | "client", code: string) => Promise<null | string>;
};

// =================================================================
// 本地 WebRTC 處理邏輯
// =================================================================
const createConnection = () => {
  return new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  });
};

const createLocalCandidates = (peerConnection: RTCPeerConnection) => {
  return new Promise<string[]>((res) => {
    const candidates: string[] = [];

    peerConnection.onicecandidate = (event) => {
      const candidate = event.candidate?.candidate;
      if (candidate) candidates.push(candidate);
      else res(candidates); // 當 candidate 為 null 時，表示 ICE 收集完成
    };
  });
};

const createLocalDescription = async (
  peerConnection: RTCPeerConnection,
  method: keyof Pick<RTCPeerConnection, "createOffer" | "createAnswer">
) => {
  const { data: description, error: err1 } = await tryCatch(peerConnection[method]());
  if (err1 || !description.sdp) return { error: "創建描述失敗", data: null };

  const candidatesPromise = createLocalCandidates(peerConnection);

  const { error: err2 } = await tryCatch(peerConnection.setLocalDescription(description));
  if (err2) return { error: "設置本地描述失敗", data: null };

  const { data: candidates, error: err3 } = await tryCatch(candidatesPromise);
  if (err3) return { error: "收集 ICE Candidate 失敗", data: null };

  return { data: { description: description.sdp, candidates }, error: null };
};

// =================================================================
// 交換 WebRTC 訊息邏輯
// =================================================================
const SessionBodySchema = z.object({ description: z.string(), candidates: z.array(z.string()) });
type SessionBody = z.infer<typeof SessionBodySchema>;
type Session = { code: string; type: "offer" | "answer"; body: SessionBody };

const sendSession = async (session: Session) => {
  const { code, type, body } = session;

  const res = await fetch(`${API_BASE}/${code}.${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status !== 204) return "發送 " + type + " 失敗";
  return null;
};

const getSession = async (peerConnection: RTCPeerConnection, session: Omit<Session, "body">) => {
  const { code, type } = session;

  const res = await fetch(`${API_BASE}/${code}.${type}`);
  if (res.status !== 200) return `取得 ${type} 失敗`;

  const { data, error } = await tryCatch(res.json());
  if (error) return `解析 ${type} 失敗`;

  const parseResult = SessionBodySchema.safeParse(data);
  if (!parseResult.success) return `解析 ${type} 失敗`;
  const { description, candidates } = parseResult.data;

  const sessionDescription = new RTCSessionDescription({ type, sdp: description });
  const { error: err1 } = await tryCatch(peerConnection.setRemoteDescription(sessionDescription));
  if (err1) return `設置遠端描述失敗`;

  // 不更詳細，因為就算知道是誰錯，我也沒辦法幹嘛
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      const { error } = await tryCatch(peerConnection.addIceCandidate(new RTCIceCandidate({ candidate })));
      return !error;
    })
  );

  if (results.every((r) => r === false)) return `添加 ICE Candidate 失敗`;

  return null;
};

const pollSession: typeof getSession = async (peerConnection, session) => {
  let attempts = 0;
  const maxAttempts = 20;

  while (true) {
    if (attempts >= maxAttempts) return `等待 ${session.type} 超時`;

    await new Promise((r) => setTimeout(r, 3000));

    const error = await getSession(peerConnection, session);
    if (!error) return null;

    attempts++;
  }
};

// =================================================================
// DataChannel 傳輸邏輯
// =================================================================
const createDataChannel = (peerConnection: RTCPeerConnection, timeout: number = 5000) => {
  const promise = new Promise<RTCDataChannel | string>((res) => {
    const dataChannel = peerConnection.createDataChannel("data", { negotiated: true, id: 0 });
    dataChannel.onopen = () => res(dataChannel);
    dataChannel.onerror = () => res("DataChannel 在連接前就發生錯誤");
    dataChannel.onclose = () => res("DataChannel 因未知原因提早關閉");
  });

  const result = Promise.race([
    promise,
    new Promise<string>((res) => setTimeout(() => res("DataChannel 開啟超時"), timeout)),
  ]);

  return result;
};

// =================================================================
// 以 Host 或 Client 身份連線的流程
// =================================================================
const connAsHost = async (peerConnection: RTCPeerConnection, code: string): Promise<null | string> => {
  const { data: body, error: err1 } = await createLocalDescription(peerConnection, "createOffer");
  if (err1 !== null) return err1;

  const err2 = await sendSession({ code, type: "offer", body });
  if (err2) return err2;

  const err3 = await pollSession(peerConnection, { code, type: "answer" });
  if (err3) return err3;

  const result = await createDataChannel(peerConnection);
  if (typeof result === "string") return result; // 發生錯誤，回傳錯誤訊息

  // TODO: 可以開始使用 dataChannel 了

  return null;
};

const connAsClient = async (peerConnection: RTCPeerConnection, code: string): Promise<null | string> => {
  const err1 = await pollSession(peerConnection, { code, type: "offer" });
  if (err1) return err1;

  const { data: body, error: err2 } = await createLocalDescription(peerConnection, "createAnswer");
  if (err2 !== null) return err2;

  const err3 = await sendSession({ code, type: "answer", body });
  if (err3) return err3;

  const result = await createDataChannel(peerConnection);
  if (typeof result === "string") return result; // 發生錯誤，回傳錯誤訊息

  // TODO: 可以開始使用 dataChannel 了

  return null;
};

// =================================================================
// API 包裝，只提供 UI 必要的資訊
// =================================================================
const WebRTCParamSchema = z.object({
  code: z.string().trim().min(1, "代碼不能為空"),
  role: z.enum(["host", "client"], "角色只能是 host 或 client"),
  status: z.enum(["disconnected"], "已經連線或正在連線中"),
});

const useWebRTC = create<WebRTCStore>((set, get) => {
  const connect = async (role: "host" | "client", code: string): Promise<null | string> => {
    const validation = WebRTCParamSchema.safeParse({ role, code, status: get().status });
    if (!validation.success) return validation.error.issues.map((i) => i.message).join("; ");

    set({ status: "connecting" });
    const peerConnection = createConnection();
    const error = role === "host" ? await connAsHost(peerConnection, code) : await connAsClient(peerConnection, code);

    if (error) {
      set({ status: "disconnected" });
      peerConnection.close();
    } else {
      set({ status: "connected" });
    }

    return error;
  };

  return { status: "disconnected", connect };
});

export { useWebRTC };
