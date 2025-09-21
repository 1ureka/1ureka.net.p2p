import { create } from "zustand";
import type { Role } from "@/native/webrtc";

interface FormState {
  role: Role;
  webrtcCode: string;
  tcpPort: number;

  current: number;
  prev: number;
  steps: string[];

  nextStep: () => void;
  prevStep: () => void;
}

const useFormStore = create<FormState>((set) => ({
  role: "host",
  webrtcCode: "",
  tcpPort: 9000,

  current: 0,
  prev: 0,
  steps: ["WebRTC 連接", "TCP 連接", "連線狀態概覽"],

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

export { useFormStore };
