// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { create } from "zustand";

// ===============================================================
// 以下是給 UI 使用的 hook， readonly
// ===============================================================
type WebRTCStatus = "disconnected" | "connected" | "failed" | "connecting";
type WebRTCLogEntry = { level: "info" | "error"; message: string; timestamp: number };

type State = {
  status: WebRTCStatus;
  history: WebRTCLogEntry[];
  error: WebRTCLogEntry | null; // 最後一次的錯誤訊息
};

const store = create<State>(() => ({
  status: "disconnected",
  history: [],
  error: null,
}));

const useWebRTC = store;
export { useWebRTC, type WebRTCLogEntry };

// ===============================================================
// 以下是給 native/webrtc.ts 使用的函式，更新狀態
// ===============================================================
type PrimitiveState = {
  status: WebRTCStatus;
  progress: string;
  error: string;
  history: never[]; // 只能清空
};

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const setState = (partial: Partial<PrimitiveState>) => {
  const now = Date.now();

  store.setState((prev) => {
    // 進度
    let history = prev.history;
    if (partial.progress !== undefined) {
      history = [...prev.history, { level: "info", message: partial.progress, timestamp: now }];
    }

    // 錯誤
    let error = prev.error;
    if (partial.error !== undefined) {
      error = { level: "error", message: partial.error, timestamp: now };
      history = [...history, error];
    }

    // 狀態
    let status = prev.status;
    if (partial.status !== undefined) {
      status = partial.status;
    }

    // 歷史只能清空 (若該次呼叫也帶如了 progress, error, 則忽略(在這裡覆蓋))
    if (partial.history !== undefined) {
      history = [];
    }

    return { status, history, error };
  });
};

export { setState, getLock };
