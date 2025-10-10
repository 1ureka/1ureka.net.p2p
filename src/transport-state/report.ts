import { IPCChannel } from "@/ipc";
import { useSession, validTransitions, type ConnectionStatus, type TrafficPoint } from "@/transport-state/store";
import type { Session } from "@/transport/session-utils";
import type { ConnectionLogEntry } from "@/utils";

/**
 * 日誌紀錄基礎函式
 */
const report = async (entry: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
  const data = entry.data ? await window.electron.request(IPCChannel.PrettyFormat, entry.data) : undefined;

  const logEntry = {
    ...entry,
    data,
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
 * 共用日誌紀錄函式型別
 */
type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;

/** 回報一般日誌 */
const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
/** 回報錯誤日誌 */
const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
/** 回報警告日誌 */
const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

export { reportLog, reportError, reportWarn };

// ------------------------------------------------------------------------------

/**
 * 流量監控回報機制
 * 內部匯聚機制：隨時可以呼叫 reportTraffic，但最終會每秒匯聚一次，並只保留 2 分鐘的資料
 */
const createTrafficReporter = () => {
  const INTERVAL_MS = 1000; // 每秒回報一次
  const MAX_AGE_MS = 120000; // 保留 2 分鐘資料
  const INTERVAL_FILTER_MS = 60000; // 每 60 秒過濾一次

  let accumulatedEgress = 0;
  let accumulatedIngress = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let lastFilter = 0;

  const startReporting = () => {
    if (intervalId !== null) return; // 已經在運行

    accumulatedEgress = 0;
    accumulatedIngress = 0;
    lastFilter = Date.now();

    intervalId = setInterval(() => {
      const now = Date.now();
      const point: TrafficPoint = { timestamp: now, egress: accumulatedEgress, ingress: accumulatedIngress };

      useSession.setState((state) => {
        const shouldFilter = now - lastFilter >= INTERVAL_FILTER_MS; // prevent animation jitter
        if (shouldFilter) {
          lastFilter = now;
          const cutoffTime = now - MAX_AGE_MS;
          const filtered = state.traffic.filter((p) => p.timestamp >= cutoffTime);
          return { traffic: [...filtered, point] };
        }

        return { traffic: [...state.traffic, point] };
      });

      // 重置累計值
      accumulatedEgress = 0;
      accumulatedIngress = 0;
    }, INTERVAL_MS);
  };

  const stopReporting = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    accumulatedEgress = 0;
    accumulatedIngress = 0;
  };

  const addEgress = (bytes: number) => {
    accumulatedEgress += bytes;
  };

  const addIngress = (bytes: number) => {
    accumulatedIngress += bytes;
  };

  return { startReporting, stopReporting, addEgress, addIngress };
};

// 全域單例
const trafficReporter = createTrafficReporter();

/** 回報出站流量資料，可隨時呼叫，會自動累加到當前秒 */
const reportEgress = (bytes: number) => trafficReporter.addEgress(bytes);
/** 回報入站流量資料，可隨時呼叫，會自動累加到當前秒 */
const reportIngress = (bytes: number) => trafficReporter.addIngress(bytes);
/** 啟動流量監控 */
const startTrafficMonitoring = () => trafficReporter.startReporting();
/** 停止流量監控 */
const stopTrafficMonitoring = () => trafficReporter.stopReporting();

export { reportEgress, reportIngress, startTrafficMonitoring, stopTrafficMonitoring };

// ------------------------------------------------------------------------------

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
 * 回報會話資訊
 */
const reportSession = (session: Session) => {
  useSession.setState({ session });
};

export { reportStatus, reportSession };

// ------------------------------------------------------------------------------

/** 取得是否為 aborted 狀態，用於流程中判斷是否中斷 */
const getAborted = () => useSession.getState().status === "aborting";
/** 訂閱一次 aborted 狀態，用於連線後中斷處理 */
const onceAborted = (callback: () => void) => {
  reportLog({ message: "registering onceAborted handler" });

  if (getAborted()) {
    callback();
    return;
  }

  const unsub = useSession.subscribe((state) => {
    if (state.status !== "aborting") return;
    unsub();
    callback();
  });
};

export { getAborted, onceAborted };
