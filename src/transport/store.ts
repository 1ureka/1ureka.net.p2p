import { create } from "zustand";
import type { ConnectionStatus, ConnectionLogEntry } from "@/utils";
import type { Session } from "@/transport/session-utils";

// 給 UI 使用 (read only)

type SessionState = {
  status: ConnectionStatus;
  history: ConnectionLogEntry[];
  session: Session;
};

const useSession = create<SessionState>(() => ({
  status: "disconnected",
  history: [],
  session: { id: "", host: "", client: "", status: "waiting", createdAt: "", signal: {} },
}));

export { useSession };

// 給邏輯使用 (set only)

const store = useSession;

const getLock = () => {
  return store.getState().status === "connecting" || store.getState().status === "connected";
};

const setSessionState = (session: Session) => {
  store.setState((prev) => ({ ...prev, session }));
};

const setStatus = (status: ConnectionStatus) => {
  store.setState((prev) => ({ ...prev, status }));
};

type PrimitiveState = {
  log: string;
  error: string;
  history: never[]; // 只能清空
};

const report = (partial: Partial<PrimitiveState>) => {
  store.setState((prev) => {
    const module = "webrtc";
    const timestamp = Date.now();
    const id = crypto.randomUUID();

    // 進度
    let history = prev.history;
    if (partial.log !== undefined) {
      const entry = { id, module, level: "info", message: partial.log, timestamp } as const;
      history = [...prev.history, entry];
    }

    // 錯誤
    if (partial.error !== undefined) {
      const entry = { id, module, level: "error", message: partial.error, timestamp } as const;
      history = [...history, entry];
    }

    // 歷史只能清空 (若該次呼叫也帶如了 progress, error, 則忽略(在這裡覆蓋))
    if (partial.history !== undefined) {
      history = [];
    }

    return { history };
  });
};

export { report, getLock, setSessionState, setStatus };
