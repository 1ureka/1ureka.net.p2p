// =================================
// Sx
// =================================
export const transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
export const buttonWithStartIconSx = { pl: 1.5, borderRadius: 2 };
export const buttonContainedSx = {
  borderRadius: 2,
  "&:hover": { bgcolor: "primary.light", scale: "1.05" },
  "&:active": { scale: "0.97" },
  transition,
};

// =================================
// Zustand Stores
// =================================
import { create } from "zustand";

// 步驟狀態管理
interface StepState {
  current: number;
  prev: number;
  steps: string[];
  nextStep: () => void;
  prevStep: () => void;
}

export const useStepStore = create<StepState>((set) => ({
  current: 0,
  prev: 0,
  steps: ["選擇角色", "交換 order / answer", "交換 ICE candidate"],
  nextStep: () =>
    set((state) => ({
      current: Math.min(state.steps.length - 1, state.current + 1),
      prev: state.current,
    })),
  prevStep: () =>
    set((state) => ({
      current: Math.max(0, state.current - 1),
      prev: state.current,
    })),
}));

// WebRTCStore, 應該要多 status: "等待填入參數" | "連線中" | "已連線"
// role, setRole(呼叫時，自動重新創建 RTCPeerConnection，因為要重置或填入其他參數，因此是 Promise), offer, setOffer(setRole時要重置 offer, answer，並在 host 時自動填入 offer), answer, setAnswer(setRole 時要重置 offer, answer), localICECandidates(setRole 時自動填入), remoteICECandidates, setRemoteICECandidates, status(只能由 create 內部修改，對於use層面來說是 readonly), connect: () => Promise<null | string ("缺少 [某個參數]" | error.message)> 會進行連線，會在建立後與橋接器連接，並在斷線時更新 status 回 "等待填入參數" 並重新呼叫 setRole
// 已連線時，記得禁用 connect 按鈕與 connect function 在 status 為 "已連線" 時，要丟出錯誤 (但不關閉已有連線)

// 表單狀態管理
export type Role = "host" | "client";

interface FormState {
  // Step1 狀態
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;

  // Step2 狀態
  offer: string;
  answer: string;
  setOffer: (offer: string) => void;
  setAnswer: (answer: string) => void;

  // 重置所有狀態
  reset: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  selectedRole: "host",
  offer: "",
  answer: "",

  setSelectedRole: (role) => set({ selectedRole: role }),
  setOffer: (offer) => set({ offer }),
  setAnswer: (answer) => set({ answer }),

  reset: () => set({ selectedRole: "host", offer: "", answer: "" }),
}));
