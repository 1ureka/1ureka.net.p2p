import { create } from "zustand";
import type { ConnectionStatus, ConnectionLogEntry } from "@/utils";
import type { Session } from "@/transport/session-utils";
import { startSession } from "@/transport/session";

// 給 UI 使用 (read only + handler)

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

const preHandle = () => {
  const { status } = useSession.getState();

  if (status === "connecting" || status === "connected") {
    useSession.setState((prev) => ({ ...prev, status: "failed" }));
    reportError({ message: "Connection has already been established or is in progress" });
    return false;
  }

  useSession.setState((prev) => ({ ...prev, status: "connecting", history: [] }));
  return true;
};

const handleCreateSession = async () => {
  if (!preHandle()) return;
  const result = await startSession();
  if (!result) useSession.setState((prev) => ({ ...prev, status: "failed" }));
};

const handleJoinSession = async (sessionId: string) => {
  if (!preHandle()) return;
  const result = await startSession(sessionId);
  if (!result) useSession.setState((prev) => ({ ...prev, status: "failed" }));
};

export { useSession, handleCreateSession, handleJoinSession };

// 給邏輯使用 (set only)

const setSessionState = (session: Session) => {
  useSession.setState((prev) => ({ ...prev, session }));
};

const report = (entry: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
  const logEntry: ConnectionLogEntry = {
    ...entry,
    module: "webrtc",
    timestamp: Date.now(),
    id: crypto.randomUUID(),
  };

  useSession.setState((prev) => {
    const history = [...prev.history, logEntry].slice(-250);
    return { ...prev, history };
  });
};

type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;
const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

export { reportLog, reportError, reportWarn, setSessionState };
