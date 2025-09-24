import { create } from "zustand";

// ===============================================================
// 以下是給 UI 使用的 hook， readonly
// ===============================================================
type WebRTCStatus = "disconnected" | "connected" | "failed" | "connecting";
type WebRTCLogEntry = { level: "info" | "error"; message: string; timestamp: number };

type State = {
  status: WebRTCStatus;
  history: WebRTCLogEntry[];
};

const store = create<State>(() => ({
  status: "disconnected",
  history: [],
}));

const useWebRTC = store;
export { useWebRTC, type WebRTCLogEntry };

// ===============================================================
// 以下是給 native/webrtc.ts 使用的函式，更新狀態
// ===============================================================
type PrimitiveState = {
  status: WebRTCStatus;
  log: string;
  error: string;
  history: never[]; // 只能清空
};

const getLock = () => store.getState().status === "connecting" || store.getState().status === "connected";

const setState = (partial: Partial<PrimitiveState>) => {
  const now = Date.now();

  store.setState((prev) => {
    // 進度
    let history = prev.history;
    if (partial.log !== undefined) {
      history = [...prev.history, { level: "info", message: partial.log, timestamp: now }];
    }

    // 錯誤
    if (partial.error !== undefined) {
      history = [...history, { level: "error", message: partial.error, timestamp: now }];
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

    return { status, history };
  });
};

export { setState, getLock };
