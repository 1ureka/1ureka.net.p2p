import { z } from "zod";
import { setState } from "@/store/webrtc";

// =================================================================
// 交換 WebRTC 訊息邏輯
// =================================================================
const API_BASE = "https://1ureka.vercel.app/api/webrtc";
const SessionBodySchema = z.object({ description: z.string(), candidates: z.array(z.string()) });

type SessionBody = z.infer<typeof SessionBodySchema>;
type Session = { code: string; type: "offer" | "answer"; body: SessionBody };

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

const getSession = async (session: Omit<Session, "body">) => {
  const { code, type } = session;

  for (let attempts = 0; attempts < 20; attempts++) {
    try {
      setState({ log: `Attempting to get ${session.type} from signaling server (${attempts + 1}/20)` });

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
