import { useCallback } from "react";
import { useFormStore } from "@/ui/form";
import { useAdapter } from "@/adapter/store";
import { useTransport } from "@/transport/store";
import { startSession } from "@/transport/session";
import { LayoutButton } from "@/ui/components/Layout";
import { IPCChannel } from "@/ipc";

const ConnectionButton = () => {
  const port = useFormStore((state) => state.port);
  const role = useFormStore((state) => state.role);
  const code = useFormStore((state) => state.code);

  const handleConnect = useCallback(async () => {
    if (role === "host") {
      const result = await startSession();
      if (result) window.electron.send(IPCChannel.AdapterStart, port, role);
    } else {
      const result = await startSession(code);
      if (result) window.electron.send(IPCChannel.AdapterStart, port, role);
    }
  }, [code, port, role]);

  const status1 = useTransport((state) => state.status);
  const status2 = useAdapter((state) => state.status);

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
