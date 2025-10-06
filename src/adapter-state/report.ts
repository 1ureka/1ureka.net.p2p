import { getWindow } from "@/main";
import { IPCChannel } from "@/ipc";
import { randomUUID } from "crypto";
import type { ConnectionLogEntry } from "@/utils";
import type { SocketChangePayload, LogsChangePayload, InstanceChangePayload } from "@/adapter-state/store";
import type { MappingChangePayload, RuleChangePayload } from "@/adapter-state/store";

const getReportMethods = (level: "info" | "warn" | "error") => {
  if (level === "info") return console.log;
  if (level === "warn") return console.warn;
  return console.error;
};

const reportInstance = (props: InstanceChangePayload) => {
  const win = getWindow();
  win.webContents.send(IPCChannel.AdapterInstanceChange, props);
};

const reportSockets = (props: SocketChangePayload) => {
  const win = getWindow();
  win.webContents.send(IPCChannel.AdapterSocketChange, props);
};

const reportMappings = (props: MappingChangePayload) => {
  const win = getWindow();
  win.webContents.send(IPCChannel.AdapterMappingChange, props);
};

const reportRules = (props: RuleChangePayload) => {
  const win = getWindow();
  win.webContents.send(IPCChannel.AdapterRuleChange, props);
};

const createReporter = (module: string) => {
  const win = getWindow();

  const report = (entry: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
    const logEntry: ConnectionLogEntry = { ...entry, module, timestamp: Date.now(), id: randomUUID() };

    const { level, message, data } = logEntry;
    getReportMethods(level)(module, level.toUpperCase(), message, data ?? "");

    const props: LogsChangePayload = { type: "add", entry: logEntry };
    win.webContents.send(IPCChannel.AdapterLogsChange, props);
  };

  type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;
  const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
  const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
  const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

  return { reportLog, reportError, reportWarn };
};

const clearHistory = () => {
  const win = getWindow();

  win.webContents.send(IPCChannel.AdapterLogsChange, { type: "clear" });
  win.webContents.send(IPCChannel.AdapterSocketChange, { type: "clear" });
  win.webContents.send(IPCChannel.AdapterMappingChange, { type: "clear" });
  win.webContents.send(IPCChannel.AdapterRuleChange, { type: "clear" });
};

export { createReporter, clearHistory, reportInstance, reportSockets, reportMappings, reportRules };
