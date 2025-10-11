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

const getTrendIcon = (current: number, last: number): string => {
  if (current > last) return "🔺";
  if (current < last) return "🔻";
  return ""; // 數字相同，無符號
};

const reportInstance = (props: InstanceChangePayload) => {
  const win = getWindow();
  win.webContents.send(IPCChannel.AdapterInstanceChange, props);
};

/**
 * Socket 狀態監控回報機制
 * 內部匯聚機制：隨時可以呼叫 reportSockets，但會每 5 秒匯聚一次並輸出摘要日誌
 */
const createReportSockets = () => {
  const INTERVAL_MS = 5000;

  let activeCount = 0;
  let closedCount = 0;
  let lastActiveCount = 0;
  let lastClosedCount = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startSummary = () => {
    if (intervalId !== null) return;
    const { reportLog } = createReporter("Adapter");

    activeCount = 0;
    closedCount = 0;
    lastActiveCount = 0;
    lastClosedCount = 0;

    intervalId = setInterval(() => {
      if (activeCount === 0 && closedCount === 0) return;

      const activeMessage = `${getTrendIcon(activeCount, lastActiveCount)} ${activeCount} active`;
      const closedMessage = `${getTrendIcon(closedCount, lastClosedCount)} ${closedCount} closed`;

      reportLog({ message: `Adapter operation report: ${activeMessage} | ${closedMessage} sockets` });
      lastActiveCount = activeCount;
      lastClosedCount = closedCount;
    }, INTERVAL_MS);
  };

  const stopSummary = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    activeCount = 0;
    closedCount = 0;
    lastActiveCount = 0;
    lastClosedCount = 0;
  };

  const reportSockets = (props: SocketChangePayload) => {
    const win = getWindow();
    win.webContents.send(IPCChannel.AdapterSocketChange, props);

    if (props.type === "add") {
      activeCount++;
    } else if (props.type === "del") {
      activeCount--;
      closedCount++;
    }
  };

  return { reportSockets, startSummary, stopSummary };
};

const { reportSockets, startSummary, stopSummary } = createReportSockets();

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
  stopSummary();
};

export { createReporter, reportClose, reportInstance, reportMappings, reportRules, reportSockets, startSummary };
