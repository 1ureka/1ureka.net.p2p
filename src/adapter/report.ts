import { IPCChannel } from "@/ipc";
import { createStore } from "zustand/vanilla";
import type { BrowserWindow } from "electron";
import type { ConnectionLogEntry } from "@/utils";

const store = createStore<{ history: ConnectionLogEntry[] }>(() => ({
  history: [],
}));

const getReportMethods = (level: "info" | "warn" | "error") => {
  if (level === "info") return console.log;
  if (level === "warn") return console.warn;
  return console.error;
};

const createReporter = (module: string, win: BrowserWindow) => {
  const report = (entry: Omit<ConnectionLogEntry, "timestamp" | "module">) => {
    const logEntry: ConnectionLogEntry = { ...entry, module, timestamp: Date.now() };

    const { level, message, data } = logEntry;
    getReportMethods(level)(module, level.toUpperCase(), message, data ?? "");

    store.setState((prev) => {
      const history = [...prev.history, logEntry].slice(-100);
      win.webContents.send(IPCChannel.AdapterLogs, history);
      return { ...prev, history };
    });
  };

  type ReportMethod = (entry: Omit<ConnectionLogEntry, "level" | "timestamp" | "module">) => void;
  const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
  const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
  const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send(IPCChannel.AdapterLogs, []);
  };

  return { reportLog, reportError, reportWarn, clearHistory };
};

export { createReporter };
