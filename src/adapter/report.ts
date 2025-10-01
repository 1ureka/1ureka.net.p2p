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

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send(IPCChannel.AdapterLogs, []);
  };

  return { reportLog, reportError, reportWarn, clearHistory };
};

type Reporter = ReturnType<typeof createReporter>;

export { createReporter, type Reporter };
