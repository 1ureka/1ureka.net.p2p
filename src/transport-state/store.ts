import { create } from "zustand";
import type { ConnectionLogEntry } from "@/utils";
import type { Session } from "@/transport/session-utils";

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
 * 轉換當前狀態至下一狀態，回傳是否成功轉換
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

export { useSession, setStatus };
export type { ConnectionStatus };
