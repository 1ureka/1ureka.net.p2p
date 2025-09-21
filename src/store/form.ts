import { create } from "zustand";
import { z } from "zod";
import type { Role } from "@/native/webrtc";

const PortSchema = z
  .number()
  .min(1024, { message: "Port/Code 至少應該大於等於 1024" })
  .max(65535, { message: "Port/Code 至少應該小於等於 65535" });

interface FormState {
  role: Role;
  webrtcCode: string;
  webrtcCodeError: string | null;
  tcpPort: string;
  tcpPortError: string | null;

  current: number;
  prev: number;
  steps: string[];

  nextStep: () => void;
  prevStep: () => void;

  setRole: (role: Role) => void;
  setWebRTCCode: (code: string) => void;
  setTcpPort: (port: string) => void;
}

const useFormStore = create<FormState>((set) => ({
  role: "host",
  webrtcCode: "12345",
  webrtcCodeError: null,
  tcpPort: "9000",
  tcpPortError: null,

  current: 0,
  prev: 0,
  steps: ["選擇角色", "WebRTC 連接", "TCP 連接"],

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

  setRole: (role) => set(() => ({ role })),
  setWebRTCCode: (code) => {
    const result = PortSchema.safeParse(Number(code));
    if (!result.success) set(() => ({ webrtcCode: code, webrtcCodeError: result.error.issues[0].message }));
    else set(() => ({ webrtcCode: code, webrtcCodeError: null }));
  },
  setTcpPort: (port) => {
    const result = PortSchema.safeParse(Number(port));
    if (!result.success) set(() => ({ tcpPort: port, tcpPortError: result.error.message }));
    else set(() => ({ tcpPort: port, tcpPortError: null }));
  },
}));

export { useFormStore };
