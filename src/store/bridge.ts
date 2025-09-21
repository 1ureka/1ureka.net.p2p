// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { create } from "zustand";
import type { BridgeStatus } from "@/native/bridge";
import type { LogEntry } from "@/native/log";

// ===============================================================
// 以下是給 UI 使用的 hook， readonly
// ===============================================================
type BridgeLogEntry = LogEntry;

type State = {
  status: BridgeStatus;
  history: BridgeLogEntry[];
};

const store = create<State>((set) => {
  window.electron.on("bridge.status", (status: BridgeStatus) => {
    set((prev) => {
      // 當狀態變成 connecting 時，也就是重新連線的時候，清空日誌
      const isClear = status === "connecting" && prev.status !== "connecting";
      return { ...prev, status, history: isClear ? [] : prev.history };
    });
  });
  window.electron.on("log.new.entry", (entry: LogEntry) => {
    set((prev) => ({ ...prev, history: [...prev.history, entry] }));
  });

  return { status: "disconnected", history: [] };
});

const useBridge = store;
export { useBridge, type BridgeLogEntry };
