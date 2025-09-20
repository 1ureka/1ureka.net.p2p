// store/webrtc.ts, store/bridge.ts 是用於讓 UI 知道目前的連線狀態
// native/webrtc.ts, native/bridge.ts 是用於處理實際的連線邏輯

import { create } from "zustand";
import { z } from "zod";
import { connAsClient, connAsHost, createConnection } from "@/native/webrtc";

const WebRTCParamSchema = z.object({
  code: z.string().trim().min(1, "代碼不能為空"),
  role: z.enum(["host", "client"], "角色只能是 host 或 client"),
  status: z.enum(["disconnected"], "已經連線或正在連線中"),
});

type WebRTCStore = {
  status: "connected" | "disconnected" | "connecting";
  progress: string;
  connect: (role: "host" | "client", code: string) => Promise<null | string>;
};

const useWebRTC = create<WebRTCStore>((set, get) => {
  let peerConnection = createConnection();

  const connect: WebRTCStore["connect"] = async (role, code) => {
    const validation = WebRTCParamSchema.safeParse({ role, code, status: get().status });
    if (!validation.success) return validation.error.issues.map((i) => i.message).join("; ");

    peerConnection = createConnection();
    set({ status: "connecting" });

    let error: string | null;
    const reportProgress = (message: string) => set({ progress: message });

    if (role === "host") {
      error = await connAsHost(peerConnection, code, reportProgress);
    } else {
      error = await connAsClient(peerConnection, code, reportProgress);
    }

    if (error) {
      peerConnection.close();
      set({ status: "disconnected", progress: "" });
    } else {
      set({ status: "connected", progress: "連線成功" });
    }

    return error;
  };

  const disconnect = () => {
    const { status } = get();
    if (status !== "connected") return;

    peerConnection.close();
    set({ status: "disconnected", progress: "" });
  };

  return { status: "disconnected", progress: "", connect, disconnect };
});

export { useWebRTC };
