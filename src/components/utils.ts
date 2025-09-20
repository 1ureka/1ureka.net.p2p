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
