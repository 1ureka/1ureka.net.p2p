import type { ConnectionLogFormattedEntry } from "@/utils";
import type { Rules } from "@/adapter/adapter-host";
import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import { type SocketPair, SocketPairSet, stringifySocketPair } from "@/adapter/ip";

type InstanceChangePayload = { instance: "host" | "client" | null };

type LogsChangePayload = { type: "add"; entry: ConnectionLogFormattedEntry } | { type: "clear"; entry?: never };

type SocketChangePayload =
  | { type: "add"; pair: SocketPair }
  | { type: "del"; pair: SocketPair }
  | { type: "clear"; pair?: never };

type MappingChangePayload =
  | { type: "add"; id: string; map: SocketPair }
  | { type: "del"; id: string; map?: never }
  | { type: "clear"; id?: never; map?: never };

type RuleChangePayload = { type: "set"; rules: Rules } | { type: "clear"; rules?: never };

type AdapterState = {
  instance: "host" | "client" | null;
  history: ConnectionLogFormattedEntry[];
  sockets: SocketPair[];
  mappings: { id: string; mapping: string; createdAt: number }[];
  rules: Rules;
};

const useAdapter = create<AdapterState>((set) => {
  const socketSet = new SocketPairSet();
  const mappingSet: Map<string, { map: SocketPair; createdAt: number }> = new Map();
  const defaultRules: Rules = { allowIPv4Local: true, allowIPv6Local: false, allowLAN: false };

  window.electron.on(IPCChannel.AdapterInstanceChange, ({ instance }: InstanceChangePayload) => {
    set({ instance });
  });

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
    if (type === "add" && map && id) {
      mappingSet.set(id, { map, createdAt: Date.now() });
    }
    if (type === "del" && id) {
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

  window.electron.on(IPCChannel.AdapterRuleChange, ({ type, rules }: RuleChangePayload) => {
    if (type === "set") {
      set({ rules: { ...rules } });
    }
    if (type === "clear") {
      set({ rules: { ...defaultRules } });
    }
  });

  return { instance: null, history: [], sockets: [], mappings: [], rules: { ...defaultRules } };
});

export { useAdapter };
export type { MappingChangePayload, RuleChangePayload };
export type { SocketChangePayload, LogsChangePayload, InstanceChangePayload };
