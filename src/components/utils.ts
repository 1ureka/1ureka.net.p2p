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
// Utility Functions
// =================================
type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

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
