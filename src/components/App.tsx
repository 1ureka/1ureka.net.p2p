import { useState } from "react";
import { LayoutBox, LayoutButton, LayoutColumn, LayoutRow, LayoutText, LayoutTitle } from "@/components-lib/Layout";
import { EnumProperty, NumberProperty } from "@/components-lib/Property";
import type { Role } from "@/native/webrtc";
import { Background } from "./Background";
import { Box, Typography } from "@mui/material";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import { ConnectionIndicator } from "./ConnectionIndicator";

const App = () => {
  const [mode, setMode] = useState<Role>("host");
  const [code, setCode] = useState(1024);
  const [port, setPort] = useState(8080);

  return (
    <LayoutRow
      sx={{ width: "100dvw", height: "100dvh", p: 2.5, gridTemplateColumns: "fit-content(350px) minmax(350px, 1fr)" }}
    >
      <Background />

      <LayoutColumn>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, p: 1.5 }}>
          <Box sx={{ bgcolor: "primary.main", p: 1, borderRadius: 1 }}>
            <LanRoundedIcon fontSize="large" sx={{ display: "block", color: "text.primary" }} />
          </Box>

          <Typography variant="h6" component="h1">
            1ureka.net.p2p
          </Typography>
        </Box>

        <LayoutBox>
          <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "auto 1fr" }}>
            <ConnectionIndicator status="disconnected" />
            <LayoutTitle>P2P configuration</LayoutTitle>
          </LayoutRow>
          <LayoutText>
            Choose <b>Host</b> if you run the service, <b>Client</b> if you want to access it. and enter the
            <b> same signaling code</b> on both sides.
          </LayoutText>

          <EnumProperty
            id="role"
            value={mode}
            onChange={(newMode) => setMode(newMode)}
            items={[
              { value: "host", label: "Host" },
              { value: "client", label: "Client" },
            ]}
          />

          <NumberProperty value={code} onChange={(value) => setCode(value)} step={1} min={0} max={Infinity} />
        </LayoutBox>

        <LayoutBox>
          <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "auto 1fr" }}>
            <ConnectionIndicator status="disconnected" />
            <LayoutTitle>TCP port</LayoutTitle>
          </LayoutRow>
          <LayoutText>
            The Host should enter the <b>service’s port</b>, while the Client chooses the <b>local port</b> to forward.
          </LayoutText>

          <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />

          <LayoutButton onClick={() => alert(`Current mode: ${mode}`)}>Connect</LayoutButton>
        </LayoutBox>
      </LayoutColumn>

      <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
        <LayoutTitle>Connection Logs</LayoutTitle>
        <LayoutText>
          Consolidated log output from all modules. Filter by <b>module</b> and <b>level</b> to quickly debug or analyze
          events.
        </LayoutText>

        {/* 統整 log 資訊，可篩選模組與 level */}
        <LayoutBox sx={{ my: 1 }}></LayoutBox>
      </LayoutBox>
    </LayoutRow>
  );
};

export { App };
