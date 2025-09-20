// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { create } from "zustand";
import type { BridgeStatus } from "@/native/bridge";

type BridgeState = {
  status: BridgeStatus;
};

export const useBridgeStore = create<BridgeState>((set) => {
  window.electron.on("bridge.status", (status) => set({ status }));
  return { status: "disconnected" };
});
