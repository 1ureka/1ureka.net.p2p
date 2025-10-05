import { getWindow } from "@/main";
import { IPCChannel } from "@/ipc";
import { createStore } from "zustand/vanilla";
import { randomUUID } from "crypto";
import type { ConnectionLogEntry } from "@/utils";
import type { SocketPair } from "@/adapter/ip";

const store = createStore<{ history: ConnectionLogEntry[] }>(() => ({
  history: [],
}));

const getReportMethods = (level: "info" | "warn" | "error") => {
  if (level === "info") return console.log;
  if (level === "warn") return console.warn;
  return console.error;
};

const createReporter = (module: string) => {
  const win = getWindow();

  const report = (entry: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
    const logEntry: ConnectionLogEntry = { ...entry, module, timestamp: Date.now(), id: randomUUID() };

    const { level, message, data } = logEntry;
    getReportMethods(level)(module, level.toUpperCase(), message, data ?? "");

    store.setState((prev) => {
      const history = [...prev.history, logEntry].slice(-250);
      win.webContents.send(IPCChannel.AdapterLogs, history);
      return { ...prev, history };
    });
  };

  type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;
  const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
  const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
  const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

  const clearHistory = () => {
    store.setState((prev) => ({ ...prev, history: [] }));
    win.webContents.send(IPCChannel.AdapterLogs, []);
  };

  const reportConnection = (pair: SocketPair, type: "add" | "del") => {
    win.webContents.send(IPCChannel.AdapterSocket, { pair, type });
  };

  return { reportLog, reportError, reportWarn, clearHistory, reportConnection };
};

export { createReporter };
