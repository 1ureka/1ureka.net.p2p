import { IPCChannel } from "@/ipc";
import { create } from "zustand";
import type { ConnectionStatus, ConnectionLogEntry } from "@/utils";

const useAdapter = create<{ status: ConnectionStatus; history: ConnectionLogEntry[] }>((set) => {
  window.electron.on(IPCChannel.AdapterStatus, (status: ConnectionStatus) => {
    set((prev) => ({ ...prev, status }));
  });
  window.electron.on(IPCChannel.AdapterLogs, (history: ConnectionLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  return { status: "disconnected", history: [] };
});

export { useAdapter };
