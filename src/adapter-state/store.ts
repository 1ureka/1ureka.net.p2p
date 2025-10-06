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

export { useAdapter };
