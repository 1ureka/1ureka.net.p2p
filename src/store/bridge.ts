import { create } from "zustand";
import type { ConnectionStatus, ConnectionLogEntry } from "@/store/type";

const useBridge = create<{ status: ConnectionStatus; history: ConnectionLogEntry[] }>((set) => {
  window.electron.on("bridge.status", (status: ConnectionStatus) => {
    set((prev) => ({ ...prev, status }));
  });
  window.electron.on("bridge.history", (history: ConnectionLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  return { status: "disconnected", history: [] };
});

export { useBridge };
