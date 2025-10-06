import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import type { ConnectionLogEntry } from "@/utils";
import { type SocketPair, SocketPairSet } from "@/adapter/ip";

type AdapterState = {
  history: ConnectionLogEntry[];
  sockets: SocketPair[];
  mappings: Map<string, { map: SocketPair; createdAt: number }>;
  rules: Map<string, { pattern: string; createdAt: number }>;
};

const useAdapter = create<AdapterState>((set) => {
  const socketSet = new SocketPairSet();
  const mappingSet = new Map();
  const ruleSet = new Map();

  window.electron.on(IPCChannel.AdapterLogs, (history: ConnectionLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  window.electron.on(IPCChannel.AdapterSocket, ({ pair, type }: { pair: SocketPair; type: "add" | "del" }) => {
    set((prev) => {
      if (type === "add") socketSet.add(pair);
      else socketSet.delete(pair);
      return { ...prev, sockets: Array.from(socketSet) };
    });
  });

  return { history: [], sockets: Array.from(socketSet), mappings: mappingSet, rules: ruleSet };
});

const handleCreateMapping = async (map: SocketPair) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateMapping, map);
  if (!id) return null;
  useAdapter.setState((state) => {
    const mappings = new Map(state.mappings);
    mappings.set(id, { map, createdAt: Date.now() });
    return { ...state, mappings };
  });
  return id as string;
};

const handleRemoveMapping = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveMapping, id);
  useAdapter.setState((state) => {
    const mappings = new Map(state.mappings);
    mappings.delete(id);
    return { ...state, mappings };
  });
};

const handleCreateRule = async (pattern: string) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateRule, pattern);
  if (!id) return null;
  useAdapter.setState((state) => {
    const rules = new Map(state.rules);
    rules.set(id, { pattern, createdAt: Date.now() });
    return { ...state, rules };
  });
  return id as string;
};

const handleRemoveRule = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveRule, id);
  useAdapter.setState((state) => {
    const rules = new Map(state.rules);
    rules.delete(id);
    return { ...state, rules };
  });
};

export { useAdapter, handleCreateMapping, handleRemoveMapping, handleCreateRule, handleRemoveRule };
