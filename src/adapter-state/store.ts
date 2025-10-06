import type { ConnectionLogEntry } from "@/utils";
import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import { type SocketPair, SocketPairSet, stringifySocketPair } from "@/adapter/ip";

type Action = "add" | "del" | "clear";
type LogsChangePayload = { type: Action; entry?: ConnectionLogEntry };
type SocketChangePayload = { type: Action; pair?: SocketPair };
type MappingChangePayload = { type: Action; id: string; map?: SocketPair };
type RuleChangePayload = { type: Action; id: string; pattern?: string };

type AdapterState = {
  history: ConnectionLogEntry[];
  sockets: SocketPair[];
  mappings: { id: string; mapping: string; createdAt: number }[];
  rules: { id: string; pattern: string; createdAt: number }[];
};

const useAdapter = create<AdapterState>((set) => {
  const socketSet = new SocketPairSet();
  const mappingSet: Map<string, { map: SocketPair; createdAt: number }> = new Map();
  const ruleSet: Map<string, { pattern: string; createdAt: number }> = new Map();

  window.electron.on(IPCChannel.AdapterLogsChange, ({ type, entry }: LogsChangePayload) => {
    set((state) => {
      if (type === "add" && entry) {
        return { history: [...state.history, entry].slice(-500) };
      }
      if (type === "clear") {
        return { history: [] };
      }
      return state;
    });
  });

  window.electron.on(IPCChannel.AdapterSocketChange, ({ pair, type }: SocketChangePayload) => {
    if (type === "add" && pair) {
      socketSet.add(pair);
    }
    if (type === "del" && pair) {
      socketSet.delete(pair);
    }
    if (type === "clear") {
      socketSet.clear();
    }

    set({ sockets: Array.from(socketSet) });
  });

  window.electron.on(IPCChannel.AdapterMappingChange, ({ id, map, type }: MappingChangePayload) => {
    if (type === "add" && map) {
      mappingSet.set(id, { map, createdAt: Date.now() });
    }
    if (type === "del") {
      mappingSet.delete(id);
    }
    if (type === "clear") {
      mappingSet.clear();
    }

    const mappings = Array.from(mappingSet, ([id, { map, createdAt }]) => ({
      id,
      mapping: stringifySocketPair(map),
      createdAt,
    }));

    set({ mappings });
  });

  window.electron.on(IPCChannel.AdapterRuleChange, ({ id, pattern, type }: RuleChangePayload) => {
    if (type === "add" && pattern) {
      ruleSet.set(id, { pattern, createdAt: Date.now() });
    }
    if (type === "del") {
      ruleSet.delete(id);
    }
    if (type === "clear") {
      ruleSet.clear();
    }

    const rules = Array.from(ruleSet, ([id, { pattern, createdAt }]) => ({
      id,
      pattern,
      createdAt,
    }));

    set({ rules });
  });

  return { history: [], sockets: [], mappings: [], rules: [] };
});

export { useAdapter };
export type { SocketChangePayload, MappingChangePayload, RuleChangePayload, LogsChangePayload };
