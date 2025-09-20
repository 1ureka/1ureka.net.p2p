import { create } from "zustand";

interface StepState {
  current: number;
  prev: number;
  steps: string[];
  nextStep: () => void;
  prevStep: () => void;
}

const useStepStore = create<StepState>((set) => ({
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

export { useStepStore };
