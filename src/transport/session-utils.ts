import { z } from "zod";
import { tryCatch } from "@/utils";
import { IPCChannel } from "@/ipc";

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

const SignalResponseSchema = z.object({
  sdp: z.string(),
  candidate: z.array(z.string()),
});

type Session = z.infer<typeof SessionSchema>;
type PollingState<T> = { data: T; error: null } | { data: null; error: string };

/**
 * 通用輪詢函數，當 404 時結束
 */
async function* polling<T>(url: string, schema: z.ZodType<T>): AsyncGenerator<PollingState<T>> {
  while (true) {
    await new Promise((r) => setTimeout(r, 100));

    const { data: response, error: fetchError } = await tryCatch(fetch(url));
    if (fetchError) {
      yield { data: null, error: `Fetch error: ${fetchError.message}` };
      continue;
    }

    if (response.status === 404) {
      yield { data: null, error: "Session has been deleted due to TTL" };
      return;
    }

    if (!response.ok) {
      yield { data: null, error: `Status code: ${response.status}` };
      continue;
    }

    const { data: json, error: jsonError } = await tryCatch(response.json());
    if (jsonError) {
      yield { data: null, error: `JSON error: ${jsonError.message}` };
      continue;
    }

    const { data, error: parseError } = schema.safeParse(json);
    if (parseError) {
      yield { data: null, error: `Invalid data: ${parseError.issues.join(", ")}` };
      continue;
    }

    yield { data, error: null };
  }
}

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

  const session = await response.json();
  return SessionSchema.parse(session);
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

  const session = await response.json();
  return SessionSchema.parse(session);
};

/**
 * 輪詢會話狀態 (伺服器長輪詢 5 秒 + fetch端無限重試直到該 session 已被 TTL 刪除，間隔 100ms)
 */
function pollingSession(id: string) {
  return polling(`${API_BASE}/session/${id}`, SessionSchema);
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

/**
 * 輪詢信令 (伺服器長輪詢 5 秒 + fetch端無限重試直到直到該 session 已被 TTL 刪除，間隔 100ms)
 */
function pollingSignal(id: string, type: "offer" | "answer") {
  return polling(`${API_BASE}/session/${id}/signal?type=${type}`, SignalResponseSchema);
}

export { createSession, joinSession, pollingSession, sendSignal, pollingSignal };
