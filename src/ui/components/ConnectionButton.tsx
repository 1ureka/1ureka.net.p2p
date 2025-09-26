import { useCallback } from "react";
import { useFormStore } from "@/ui/form";
import { useBridge } from "@/store/bridge";
import { useTransport } from "@/transport/store";
import { createWebRTC } from "@/native/webrtc";
import { LayoutButton } from "@/ui/components/Layout";

const ConnectionButton = () => {
  const port = useFormStore((state) => state.port);
  const role = useFormStore((state) => state.role);
  const code = useFormStore((state) => state.code);

  const handleConnect = useCallback(async () => {
    const result = await createWebRTC({ role, code: String(code) });
    if (result) window.electron.send(`bridge.start.${role}`, port);
  }, [code, port, role]);

  const status1 = useTransport((state) => state.status);
  const status2 = useBridge((state) => state.status);

  return (
    <LayoutButton
      onClick={handleConnect}
      disabled={status1 === "connected" || status2 === "connected"}
      loading={status1 === "connecting" || status2 === "connecting"}
    >
      Connect
    </LayoutButton>
  );
};

export { ConnectionButton };
