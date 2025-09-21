import type { BrowserWindow } from "electron";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

const createReporter = (module: string, win: BrowserWindow) => {
  return (params: Omit<LogEntry, "timestamp" | "module">) => {
    const entry: LogEntry = { ...params, module, timestamp: new Date().toISOString() };
    win.webContents.send("log.new.entry", entry);

    const { level, message, data, timestamp } = entry;
    const prefix = `[${new Date(timestamp).toLocaleTimeString()}] [${module}] ${level.toUpperCase()}:`;
    const methods = { info: console.log, warn: console.warn, error: console.error };
    methods[level](prefix, message, data ?? "");
  };
};

export { createReporter, type LogEntry };
