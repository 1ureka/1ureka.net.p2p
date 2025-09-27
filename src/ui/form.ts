import { create } from "zustand";

type Role = "host" | "client";

type FormState = {
  role: Role;
  code: string;
  port: number;
  setRole: (role: Role) => void;
  setCode: (code: string) => void;
  setPort: (port: number) => void;
};

const useFormStore = create<FormState>((set) => ({
  role: "host",
  code: "",
  port: 8080,

  setRole: (role) => set(() => ({ role })),
  setCode: (code) => set(() => ({ code })),
  setPort: (port) => set(() => ({ port })),
}));

export { useFormStore, type Role };
