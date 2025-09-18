import { create } from "zustand";

export const transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
export const buttonWithStartIconSx = { pl: 1.5, borderRadius: 2 };
export const buttonContainedSx = {
  borderRadius: 2,
  "&:hover": { bgcolor: "primary.light", scale: "1.05" },
  "&:active": { scale: "0.97" },
  transition,
};

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

// 表單狀態管理
export type Role = "caller" | "receiver" | null;

interface FormState {
  // Step1 狀態
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;

  // Step2 狀態
  order: string;
  answer: string;
  setOrder: (order: string) => void;
  setAnswer: (answer: string) => void;

  // 重置所有狀態
  reset: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  selectedRole: null,
  order: "",
  answer: "",

  setSelectedRole: (role) => set({ selectedRole: role }),
  setOrder: (order) => set({ order }),
  setAnswer: (answer) => set({ answer }),

  reset: () =>
    set({
      selectedRole: null,
      order: "",
      answer: "",
    }),
}));
