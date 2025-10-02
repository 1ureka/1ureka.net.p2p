import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import type { ConnectionLogEntry } from "@/utils";
import { type SocketPair, SocketPairSet } from "@/adapter/ip";

type AdapterState = {
  history: ConnectionLogEntry[];
  sockets: SocketPair[];
};

const useAdapter = create<AdapterState>((set) => {
  const socketSet = new SocketPairSet();

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

  return { history: [], sockets: Array.from(socketSet) };
});

export { useAdapter };
