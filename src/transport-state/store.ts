import { create } from "zustand";
import type { ConnectionLogFormattedEntry } from "@/utils";
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
 * 流量監控資料點
 */
type TrafficPoint = { timestamp: number; rate: number };

/**
 * 全域狀態管理 (Zustand)
 */
type SessionState = {
  role: "host" | "client";
  status: ConnectionStatus;
  history: ConnectionLogFormattedEntry[];
  session: Session;
  traffic: ReadonlyArray<TrafficPoint>;
};
const useSession = create<SessionState>(() => ({
  role: "host",
  status: "disconnected",
  history: [],
  session: { id: "", host: "", client: "", createdAt: "", signal: {} },
  traffic: [],
}));

export { useSession, validTransitions };
export type { ConnectionStatus, TrafficPoint };
