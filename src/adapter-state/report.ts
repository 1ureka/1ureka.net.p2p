/* eslint-disable import/no-duplicates */

import { inspect } from "node:util";
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

  const report = ({ data, ...rest }: Omit<ConnectionLogEntry, "id" | "timestamp" | "module">) => {
    const entry = {
      ...rest,
      id: randomUUID(),
      timestamp: Date.now(),
      module,
      data: data ? inspect(data, { depth: 3, colors: false }) : undefined,
    };

    getReportMethods(entry.level)(entry.module, entry.level.toUpperCase(), entry.message, entry.data ?? "");

    const props: LogsChangePayload = { type: "add", entry };
    win.webContents.send(IPCChannel.AdapterLogsChange, props);
  };

  type ReportMethod = (entry: Omit<ConnectionLogEntry, "id" | "level" | "timestamp" | "module">) => void;
  const reportLog: ReportMethod = (entry) => report({ ...entry, level: "info" });
  const reportError: ReportMethod = (entry) => report({ ...entry, level: "error" });
  const reportWarn: ReportMethod = (entry) => report({ ...entry, level: "warn" });

  return { reportLog, reportError, reportWarn };
};

const reportClose = () => {
  const win = getWindow();

  win.webContents.send(IPCChannel.AdapterLogsChange, { type: "clear" });
  reportInstance({ instance: null });
  reportSockets({ type: "clear" });
  reportMappings({ type: "clear" });
  reportRules({ type: "clear" });
};

export { createReporter, reportClose, reportInstance, reportSockets, reportMappings, reportRules };
