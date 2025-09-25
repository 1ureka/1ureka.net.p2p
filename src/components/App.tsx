import LanRoundedIcon from "@mui/icons-material/LanRounded";
import { Box, Typography } from "@mui/material";

import { useFormStore } from "@/store/form";
import { useBridge } from "@/store/bridge";
import { useWebRTC } from "@/store/webrtc";
import type { Role } from "@/native/webrtc";

import { LayoutBox, LayoutColumn, LayoutRow } from "@/components-lib/Layout";
import { LayoutText, LayoutTitle } from "@/components-lib/Layout";
import { EnumProperty, NumberProperty } from "@/components-lib/Property";

import { Background } from "@/components/Background";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import { ConnectionLogs } from "@/components/ConnectionLogs";
import { ConnectionButton } from "@/components/ConnectionButton";

const Title = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, p: 1.5 }}>
    <Box sx={{ bgcolor: "primary.main", p: 1, borderRadius: 1 }}>
      <LanRoundedIcon fontSize="large" sx={{ display: "block", color: "text.primary" }} />
    </Box>

    <Typography variant="h6" component="h1">
      1ureka.net.p2p
    </Typography>
  </Box>
);

const WebRTCPanel = () => {
  const role = useFormStore((state) => state.role);
  const setRole = useFormStore((state) => state.setRole);
  const code = useFormStore((state) => state.code);
  const setCode = useFormStore((state) => state.setCode);
  const status = useWebRTC((state) => state.status);

  const items: Array<{ value: Role; label: string }> = [
    { value: "host", label: "Host" },
    { value: "client", label: "Client" },
  ];

  return (
    <LayoutBox>
      <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "auto 1fr" }}>
        <ConnectionIndicator status={status} />
        <LayoutTitle>P2P configuration</LayoutTitle>
      </LayoutRow>

      <LayoutText>
        Choose <b>Host</b> if you run the service, <b>Client</b> if you want to access it. and enter the
        <b> same signaling code</b> on both sides.
      </LayoutText>

      <EnumProperty id="role" value={role} onChange={(role) => setRole(role)} items={items} />
      <NumberProperty value={code} onChange={(value) => setCode(value)} step={1} min={0} max={Infinity} />
    </LayoutBox>
  );
};

const BridgePanel = () => {
  const port = useFormStore((state) => state.port);
  const setPort = useFormStore((state) => state.setPort);
  const status = useBridge((state) => state.status);

  return (
    <LayoutBox>
      <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "auto 1fr" }}>
        <ConnectionIndicator status={status} />
        <LayoutTitle>TCP port</LayoutTitle>
      </LayoutRow>

      <LayoutText>
        The Host should enter the <b>service’s port</b>, while the Client chooses the <b>local port</b> to forward.
      </LayoutText>

      <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />
      <ConnectionButton />
    </LayoutBox>
  );
};

const LogPanel = () => {
  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
      <LayoutTitle>Connection Logs</LayoutTitle>
      <LayoutText>
        Consolidated log output from all modules. Filter by <b>module</b> and <b>level</b> to quickly debug or analyze
        events.
      </LayoutText>

      <LayoutBox sx={{ my: 1, "& > div": { gridTemplateRows: "1fr" }, height: "75dvh" }}>
        <ConnectionLogs />
      </LayoutBox>
    </LayoutBox>
  );
};

const rootSx = {
  width: "100dvw",
  height: "100dvh",
  p: 2.5,
  gridTemplateColumns: "fit-content(350px) minmax(350px, 1fr)",
};

const App = () => (
  <LayoutRow sx={rootSx}>
    <Background />
    <LayoutColumn>
      <Title />
      <WebRTCPanel />
      <BridgePanel />
    </LayoutColumn>
    <LayoutColumn>
      <LogPanel />
    </LayoutColumn>
  </LayoutRow>
);

export { App };
