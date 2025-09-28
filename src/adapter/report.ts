import { IPCChannel } from "@/ipc";
import { createStore } from "zustand/vanilla";
import type { BrowserWindow } from "electron";
import type { ConnectionStatus, ConnectionLogEntry } from "@/utils";

const store = createStore<{ status: ConnectionStatus; history: ConnectionLogEntry[] }>(() => ({
  status: "disconnected",
  history: [],
}));

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const getReportMethods = (level: "info" | "warn" | "error") => {
  if (level === "info") return console.log;
  if (level === "warn") return console.warn;
  return console.error;
};

const createReporter = (module: string, win: BrowserWindow) => {
  const reportLog = (entry: Omit<ConnectionLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "info" });
  const reportError = (entry: Omit<ConnectionLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "error" });
  const reportWarn = (entry: Omit<ConnectionLogEntry, "level" | "timestamp" | "module">) =>
    report({ ...entry, level: "warn" });

  const report = (entry: Omit<ConnectionLogEntry, "timestamp" | "module">) => {
    const timestamp = Date.now();
    const logEntry: ConnectionLogEntry = { ...entry, module, timestamp };

    const { level, message, data } = logEntry;
    getReportMethods(level)(module, level.toUpperCase(), message, data ?? "");

    store.setState((prev) => {
      const history = [...prev.history, logEntry].slice(-100);
      win.webContents.send(IPCChannel.AdapterLogs, history);
      return { ...prev, history };
    });
  };

  const reportStatus = (status: ConnectionStatus) => {
    store.setState((prev) => {
      if (status === prev.status) return { ...prev };
      win.webContents.send(IPCChannel.AdapterStatus, status);
      return { ...prev, status };
    });
  };

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send(IPCChannel.AdapterLogs, []);
  };

  return { reportLog, reportError, reportWarn, reportStatus, clearHistory };
};

type Reporter = ReturnType<typeof createReporter>;

export { createReporter, getLock, type Reporter };
