import type { BrowserWindow } from "electron";
import { createStore } from "zustand/vanilla";

type BridgeStatus = "disconnected" | "connected" | "failed" | "connecting";
type BridgeLogEntry = {
  level: "info" | "warn" | "error";
  module: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

type State = {
  status: BridgeStatus;
  history: BridgeLogEntry[];
};

const store = createStore<State>(() => ({
  status: "disconnected",
  history: [],
}));

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const createReporter = (module: string, win: BrowserWindow) => {
  const reportLog = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "info" });
  const reportError = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "error" });
  const reportWarn = (entry: Omit<BridgeLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "warn" });

  const reportMethods = { info: console.log, warn: console.warn, error: console.error };

  const report = (entry: Omit<BridgeLogEntry, "timestamp" | "module">) => {
    const timestamp = Date.now();
    const logEntry: BridgeLogEntry = { ...entry, module, timestamp };

    store.setState((prev) => {
      const history = [...prev.history, logEntry].slice(-100);
      win.webContents.send("bridge.history", history);

      const { level, message, data } = logEntry;
      reportMethods[level](module, level.toUpperCase(), message, data ?? "");

      return { ...prev, history };
    });
  };

  const reportStatus = (status: BridgeStatus) => {
    store.setState((prev) => {
      if (status === prev.status) return { ...prev };
      win.webContents.send("bridge.status", status);
      return { ...prev, status };
    });
  };

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send("bridge.history", []);
  };

  return { reportLog, reportError, reportWarn, reportStatus, clearHistory };
};

export { createReporter, getLock, type BridgeStatus, type BridgeLogEntry };
