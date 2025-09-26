import { create } from "zustand";
import type { Role } from "@/native/webrtc";

type FormState = {
  role: Role;
  code: number;
  port: number;
  setRole: (role: Role) => void;
  setCode: (code: number) => void;
  setPort: (port: number) => void;
};

const useFormStore = create<FormState>((set) => ({
  role: "host",
  code: 1024,
  port: 8080,

  setRole: (role) => set(() => ({ role })),
  setCode: (code) => set(() => ({ code })),
  setPort: (port) => set(() => ({ port })),
}));

export { useFormStore };
