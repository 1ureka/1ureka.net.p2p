import { z } from "zod";
import { IPCChannel } from "@/ipc";
import { setSessionState } from "@/transport/store";

/**
 * Session-based WebRTC API 相關的 schema 與型別
 */
const API_BASE = "https://1ureka.vercel.app/api";

const SessionSignalSchema = z.object({
  offer: z.object({ sdp: z.string(), candidate: z.array(z.string()) }).optional(),
  answer: z.object({ sdp: z.string(), candidate: z.array(z.string()) }).optional(),
});

const SessionSchema = z.object({
  id: z.string(),
  host: z.string(),
  client: z.string(),
  status: z.enum(["waiting", "joined", "signaling"]),
  createdAt: z.string(),
  signal: SessionSignalSchema,
});

const SignalRequestSchema = z.object({
  type: z.enum(["offer", "answer"]),
  sdp: z.string(),
  candidate: z.array(z.string()),
});

type Session = z.infer<typeof SessionSchema>;

/**
 * 創建新會話
 */
const createSession = async (): Promise<Session> => {
  const hostname = await window.electron.request(IPCChannel.OSInfo);
  if (typeof hostname !== "string" || hostname.trim().length === 0) {
    throw new Error("Invalid hostname from IPC");
  }

  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: hostname }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session, status code: ${response.status}`);
  }

  const session = SessionSchema.parse(await response.json());
  setSessionState(session);
  return session;
};

/**
 * 加入會話
 */
const joinSession = async (id: string): Promise<Session> => {
  const hostname = await window.electron.request(IPCChannel.OSInfo);
  if (typeof hostname !== "string" || hostname.trim().length === 0) {
    throw new Error("Invalid hostname from IPC");
  }

  const response = await fetch(`${API_BASE}/session/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client: hostname }),
  });

  if (!response.ok) {
    throw new Error(`Failed to join session, status code: ${response.status}`);
  }

  const session = SessionSchema.parse(await response.json());
  setSessionState(session);
  return session;
};

/**
 * 輪詢會話狀態 (伺服器長輪詢 5 秒 + fetch端無限重試直到該 session 已被 TTL 刪除，間隔 100ms)
 */
async function* pollingSession(id: string, event: "join" | "offer" | "answer") {
  while (true) {
    await new Promise((r) => setTimeout(r, 100));

    const response = await fetch(`${API_BASE}/session/${id}?for=${event}`);
    if (response.status === 404) {
      throw new Error("Session has been deleted due to TTL");
    }

    const session = SessionSchema.parse(await response.json());
    setSessionState(session);
    yield session;
  }
}

/**
 * 發送信令
 */
const sendSignal = async (id: string, data: z.infer<typeof SignalRequestSchema>): Promise<void> => {
  const parsedData = SignalRequestSchema.parse(data);

  const response = await fetch(`${API_BASE}/session/${id}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsedData),
  });

  if (!response.ok) {
    throw new Error(`Failed to send ${parsedData.type}, status code: ${response.status}`);
  }
};

export { createSession, joinSession, pollingSession, sendSignal, type Session };
