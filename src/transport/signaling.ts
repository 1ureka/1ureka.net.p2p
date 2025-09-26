import { z } from "zod";
import { setState } from "@/transport/store";

/**
 * 信令伺服器相關的 url, schema 與型別
 */
const API_BASE = "https://1ureka.vercel.app/api/webrtc";
const SessionBodySchema = z.object({ description: z.string(), candidates: z.array(z.string()) });

type SessionBody = z.infer<typeof SessionBodySchema>;
type Session = { code: string; type: "offer" | "answer"; body: SessionBody };
type GetSessionParams = Omit<Session, "body"> & { attempts: number };

/**
 * 發送 SDP 與 ICE Candidate 的函數
 */
const sendSession = async (session: Session) => {
  const { code, type, body } = session;
  setState({ log: `Attempting to send ${type} to signaling server` });

  const res = await fetch(`${API_BASE}/${code}.${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status !== 204) throw new Error(`failed to send ${type}, status code: ${res.status}`);
};

/**
 * 獲取 SDP 與 ICE Candidate 的函數
 */
const getSession = async (params: GetSessionParams) => {
  const { code, type, attempts } = params;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      setState({ log: `Attempting to get ${type} from signaling server (${attempt + 1}/${attempts})` });

      const res = await fetch(`${API_BASE}/${code}.${type}`);
      if (res.status !== 200) throw new Error(`failed to get ${type}, status code: ${res.status}`);

      return SessionBodySchema.parse(await res.json());
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  throw new Error(`failed to get ${type}, reached max attempts`);
};

export { sendSession, getSession };
