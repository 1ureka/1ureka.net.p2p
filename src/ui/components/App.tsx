import LanRoundedIcon from "@mui/icons-material/LanRounded";
import { Box, Typography } from "@mui/material";

import { type Role, useFormStore } from "@/ui/form";
import { useAdapter } from "@/adapter/store";
import { useTransport } from "@/transport/store";

import { LayoutBox, LayoutColumn, LayoutRow, LayoutText, LayoutTitle } from "@/ui/components/Layout";
import { EnumProperty, NumberProperty, TextProperty } from "@/ui/components/Property";
import { Background } from "@/ui/components/Background";
import { ConnectionIndicator } from "@/ui/components/ConnectionIndicator";
import { ConnectionLogs } from "@/ui/components/ConnectionLogs";
import { ConnectionButton } from "@/ui/components/ConnectionButton";

const Title = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, p: 1.5 }}>
    <Box sx={{ bgcolor: "primary.main", p: 1, borderRadius: 1 }}>
      <LanRoundedIcon fontSize="large" sx={{ display: "block", color: "text.primary" }} />
    </Box>

    <Typography variant="h6" component="h1">
      1ureka.net.p2p v1.0.0-alpha.2
    </Typography>
  </Box>
);

const WebRTCPanel = () => {
  const role = useFormStore((state) => state.role);
  const setRole = useFormStore((state) => state.setRole);
  const code = useFormStore((state) => state.code);
  const setCode = useFormStore((state) => state.setCode);
  const status = useTransport((state) => state.status);

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
      <TextProperty value={code} onChange={(e) => setCode(e.target.value)} placeholder="code" />
    </LayoutBox>
  );
};

const AdapterPanel = () => {
  const port = useFormStore((state) => state.port);
  const setPort = useFormStore((state) => state.setPort);
  const status = useAdapter((state) => state.status);

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

      <LayoutBox sx={{ my: 1, "& > div": { gridTemplateRows: "1fr" } }}>
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
      <AdapterPanel />
    </LayoutColumn>
    <LayoutColumn sx={{ gridTemplateRows: "1fr", height: 1 }}>
      <LogPanel />
    </LayoutColumn>
  </LayoutRow>
);

export { App };
