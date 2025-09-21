// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { create } from "zustand";

// ===============================================================
// 以下是給 UI 使用的 hook， readonly
// ===============================================================
type WebRTCStatus = "disconnected" | "connected" | "failed" | "connecting";
type HistoryItem = { message: string; timestamp: number };

type State = {
  status: WebRTCStatus;
  history: HistoryItem[]; // 歷史進度訊息
  error: HistoryItem | null; // 最後一次的錯誤訊息
};

const store = create<State>(() => ({
  status: "disconnected",
  history: [],
  error: null,
}));

const useWebRTC = store;
export { useWebRTC };

// ===============================================================
// 以下是給 native/webrtc.ts 使用的函式，更新狀態
// ===============================================================
const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const clearHistory = () => store.setState({ history: [], error: null });

const setState = (partial: Partial<{ status: WebRTCStatus; progress: string; error: string }>) => {
  const now = Date.now();

  store.setState((state) => {
    const status = "status" in partial ? partial.status : undefined;
    const progress = partial.progress ? { message: partial.progress, timestamp: now } : undefined;
    const error = partial.error ? { message: partial.error, timestamp: now } : undefined;

    return {
      ...(status ? { status } : {}),
      ...(progress ? { history: [...state.history, progress].slice(-25) } : {}),
      ...(error ? { error } : {}),
    };
  });
};

export { setState, getLock, clearHistory };
