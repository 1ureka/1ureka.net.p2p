import { create } from "zustand";
import type { BridgeLogEntry, BridgeStatus } from "@/native/bridge-report";

// ===============================================================
// 以下是給 UI 使用的 hook， readonly
// ===============================================================
type State = {
  status: BridgeStatus;
  history: BridgeLogEntry[];
};

const useBridge = create<State>((set) => {
  window.electron.on("bridge.status", (status: BridgeStatus) => {
    set((prev) => ({ ...prev, status }));
  });
  window.electron.on("bridge.history", (history: BridgeLogEntry[]) => {
    set((prev) => ({ ...prev, history }));
  });

  return { status: "disconnected", history: [] };
});

export { useBridge };
