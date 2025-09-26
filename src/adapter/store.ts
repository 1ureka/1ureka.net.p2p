import { create } from "zustand";
import type { ConnectionStatus, ConnectionLogEntry } from "@/utils";

const useAdapter = create<{ status: ConnectionStatus; history: ConnectionLogEntry[] }>((set) => {
  window.electron.on("bridge.status", (status: ConnectionStatus) => {
    set((prev) => ({ ...prev, status }));
  });
  window.electron.on("bridge.history", (history: ConnectionLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  return { status: "disconnected", history: [] };
});

export { useAdapter };
