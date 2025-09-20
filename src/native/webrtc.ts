// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { tryCatch } from "src/utils";
import { z } from "zod";

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
  return new Promise<string[]>(async (res) => {
    const candidates: string[] = [];

    peerConnection.onicecandidate = (event) => {
      const candidate = event.candidate;
      if (candidate) candidates.push(JSON.stringify(candidate.toJSON()));
      else res(candidates); // 當 candidate 為 null 時，表示 ICE 收集完成
    };

    await new Promise((r) => setTimeout(r, 5000)); // 最多等 5 秒
    res(candidates);
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
  if (err3 || candidates.length === 0) return { error: "收集 ICE Candidate 失敗", data: null };

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

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        return true;
      } catch {
        return false;
      }
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
const createDataChannel = (peerConnection: RTCPeerConnection, timeout: number = 15000) => {
  return new Promise<RTCDataChannel | string>(async (res) => {
    const dataChannel = peerConnection.createDataChannel("data", { negotiated: true, id: 0 });
    dataChannel.onopen = () => res(dataChannel);
    dataChannel.onerror = () => res("DataChannel 在連接前就發生錯誤");
    dataChannel.onclose = () => res("DataChannel 因未知原因提早關閉");
  });
};

// =================================================================
// 以 Host 或 Client 身份連線的流程
// =================================================================
type ConnectFunction = (
  pc: RTCPeerConnection,
  code: string,
  report?: (message: string) => void
) => Promise<null | string>;

const connAsHost: ConnectFunction = async (pc, code, report) => {
  const dataChannelPromise = createDataChannel(pc);

  report?.("建立連線中，準備創建本地描述");
  const { data: body, error: err1 } = await createLocalDescription(pc, "createOffer");
  if (err1 !== null) return err1;

  report?.("創建本地描述完成，準備發送至伺服器");
  const err2 = await sendSession({ code, type: "offer", body });
  if (err2) return err2;

  report?.("本地描述發送完成，等待對方回應");
  const err3 = await pollSession(pc, { code, type: "answer" });
  if (err3) return err3;

  report?.("收到對方描述，連線建立中");
  const result = await Promise.race([
    dataChannelPromise,
    new Promise<string>((r) => setTimeout(() => r("等待 DataChannel 超時"), 5000)),
  ]);
  if (typeof result === "string") return result;

  // TODO: 可以開始使用 dataChannel 了

  return null;
};

const connAsClient: ConnectFunction = async (pc, code, report) => {
  const dataChannelPromise = createDataChannel(pc);

  report?.("建立連線中，等待對方的描述");
  const err1 = await pollSession(pc, { code, type: "offer" });
  if (err1) return err1;

  report?.("收到對方描述，準備創建本地描述");
  const { data: body, error: err2 } = await createLocalDescription(pc, "createAnswer");
  if (err2 !== null) return err2;

  report?.("創建本地描述完成，準備發送至伺服器");
  const err3 = await sendSession({ code, type: "answer", body });
  if (err3) return err3;

  report?.("本地描述發送完成，連線建立中");
  const result = await Promise.race([
    dataChannelPromise,
    new Promise<string>((r) => setTimeout(() => r("等待 DataChannel 超時"), 5000)),
  ]);
  if (typeof result === "string") return result;

  // TODO: 可以開始使用 dataChannel 了

  return null;
};

export { createConnection, connAsHost, connAsClient };
