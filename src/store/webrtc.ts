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
  history: HistoryItem[]; // 歷史進度訊息 (只包含進度訊息，不包含錯誤訊息)
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
type PrimitiveState = {
  status: WebRTCStatus;
  progress: string;
  history: never[]; // 只能清空
  error: string;
};

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const setState = (partial: Partial<PrimitiveState>) => {
  const now = Date.now();

  store.setState((prev) => {
    // 進度
    let history = prev.history;
    if (partial.history !== undefined) {
      history = [];
    } else if (partial.progress !== undefined) {
      history = [...prev.history, { message: partial.progress, timestamp: now }];
    }

    // 錯誤
    let error = prev.error;
    if (partial.error !== undefined) {
      error = { message: partial.error, timestamp: now };
    }

    // 狀態
    let status = prev.status;
    if (partial.status !== undefined) {
      status = partial.status;
    }

    return { status, history, error };
  });
};

export { setState, getLock };
