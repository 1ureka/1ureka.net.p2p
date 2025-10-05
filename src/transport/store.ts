import { create } from "zustand";
import type { ConnectionLogEntry } from "@/utils";
import type { Session } from "@/transport/session-utils";
import { createHostSession } from "@/transport/session-host";
import { createClientSession } from "@/transport/session-client";

/**
 * Connection Status FSM 狀態機
 */
type ConnectionStatus = "disconnected" | "joining" | "waiting" | "signaling" | "connected" | "aborting" | "failed";
const validTransitions: Record<ConnectionStatus, ConnectionStatus[]> = {
  disconnected: ["joining"],
  joining: ["waiting", "failed", "aborting"],
  waiting: ["signaling", "failed", "aborting"],
  signaling: ["connected", "failed", "aborting"],
  connected: ["failed", "aborting"],
  aborting: ["failed"],
  failed: ["disconnected"],
};

/**
 * 全域狀態管理 (Zustand)
 */
type SessionState = {
  role: "host" | "client";
  status: ConnectionStatus;
  history: ConnectionLogEntry[];
  session: Session;
};
const useSession = create<SessionState>(() => ({
  role: "host",
  status: "disconnected",
  history: [],
  session: { id: "", host: "", client: "", createdAt: "", signal: {} },
}));

/**
 * 狀態轉換函式 (有驗證轉換合法性) --- 回傳是否成功轉換
 */
const setStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  const validNextStatuses = validTransitions[current];
  if (!validNextStatuses.includes(status)) {
    reportError({ message: `Invalid status transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};

/**
 * 日誌紀錄基礎函式
 */
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

/**
 * UI 事件處理函式
 */
const handlers = {
  handleCreateSession() {
    useSession.setState({ role: "host" });
    createHostSession();
  },
  handleJoinSession(sessionId: string) {
    useSession.setState({ role: "client" });
    createClientSession(sessionId);
  },
  handleStop() {
    if (!setStatus("aborting")) return;
    reportWarn({ message: "Stop requested by user" });
  },
  handleLeave() {
    if (!setStatus("disconnected")) return;
    useSession.setState({ session: { id: "", host: "", client: "", createdAt: "", signal: {} }, history: [] });
  },
};

/**
 * 流程邏輯使用
 */
const controller = {
  /** 狀態轉換函式 (有驗證轉換合法性) --- 回傳是否成功轉換 */
  setStatus,
  /** 設定會話資訊 */
  setSession(session: Session) {
    useSession.setState({ session });
  },
  /** 取得是否為 aborted 狀態，用於流程中判斷是否中斷 */
  get aborted() {
    return useSession.getState().status === "aborting";
  },
  /** 訂閱一次 aborted 狀態，用於連線後中斷處理 */
  onceAborted(callback: () => void) {
    if (useSession.getState().status === "aborting") {
      callback();
      return;
    }

    const unsub = useSession.subscribe((state) => {
      if (state.status !== "aborting") return;
      callback();
      unsub();
    });
  },

  // 日誌紀錄函式
  reportLog,
  reportError,
  reportWarn,
};

export { useSession, handlers, controller };
export type { ConnectionStatus };
