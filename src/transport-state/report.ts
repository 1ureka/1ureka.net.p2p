import { useSession, validTransitions, type ConnectionStatus } from "@/transport-state/store";
import type { Session } from "@/transport/session-utils";
import type { ConnectionLogEntry } from "@/utils";

/**
 * 日誌紀錄基礎函式
 */
const report = (entry: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
  const logEntry: ConnectionLogEntry = {
    ...entry,
    module: "session",
    timestamp: Date.now(),
    id: crypto.randomUUID(),
  };

  useSession.setState((prev) => {
    const history = [...prev.history, logEntry].slice(-250);
    return { ...prev, history };
  });
};

/**
 * 轉換當前狀態至下一狀態，回傳是否成功轉換
 */
const reportStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  if (current === status) {
    reportWarn({ message: `Redundant status transition to ${status}` });
    return true;
  }

  const validNextStatuses = validTransitions[current];
  if (!validNextStatuses.includes(status)) {
    reportError({ message: `Invalid status transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};

/**
 * 共用日誌紀錄函式型別
 */
type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;

/** 回報一般日誌 */
const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
/** 回報錯誤日誌 */
const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
/** 回報警告日誌 */
const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });
/** 回報會話資訊 */
const reportSession = (session: Session) => useSession.setState({ session });

/** 取得是否為 aborted 狀態，用於流程中判斷是否中斷 */
const getAborted = () => useSession.getState().status === "aborting";
/** 訂閱一次 aborted 狀態，用於連線後中斷處理 */
const onceAborted = (callback: () => void) => {
  if (useSession.getState().status === "aborting") {
    callback();
    return;
  }

  const unsub = useSession.subscribe((state) => {
    if (state.status !== "aborting") return;
    callback();
    unsub();
  });
};

export { reportStatus, reportLog, reportError, reportWarn, reportSession, getAborted, onceAborted };
