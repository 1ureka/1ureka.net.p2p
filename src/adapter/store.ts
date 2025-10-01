import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import type { ConnectionLogEntry } from "@/utils";

const useAdapter = create<{ history: ConnectionLogEntry[] }>((set) => {
  window.electron.on(IPCChannel.AdapterLogs, (history: ConnectionLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  return { history: [] };
});

export { useAdapter };
