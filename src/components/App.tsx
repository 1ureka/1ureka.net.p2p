import { useState } from "react";
import { LayoutBox, LayoutButton, LayoutColumn, LayoutRow, LayoutText, LayoutTitle } from "@/components-lib/Layout";
import { EnumProperty, NumberProperty } from "@/components-lib/Property";
import type { Role } from "@/native/webrtc";
import { Background } from "./Background";

const App = () => {
  const [mode, setMode] = useState<Role>("host");
  const [code, setCode] = useState(1024);
  const [port, setPort] = useState(8080);

  return (
    <LayoutRow sx={{ width: "100dvw", height: "100dvh", p: 5, gridTemplateColumns: "0.75fr 1fr" }}>
      <Background />

      <LayoutColumn sx={{ gridTemplateRows: "auto auto 1fr" }}>
        <LayoutBox>
          <LayoutRow>
            <LayoutTitle>P2P configuration</LayoutTitle>
          </LayoutRow>
          <LayoutText>
            Choose <b>Host</b> if you run the service, <b>Client</b> if you want to access it. and enter the
            <b>same signaling code</b> on both sides.
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
          <LayoutTitle>TCP port</LayoutTitle>
          <LayoutText>
            The Host should enter the <b>service’s port</b>, while the Client chooses the <b>local port</b> to forward.
          </LayoutText>

          <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />

          <LayoutButton onClick={() => alert(`Current mode: ${mode}`)}>Connect</LayoutButton>
        </LayoutBox>

        <LayoutBox sx={{ height: 1 }}>
          <LayoutTitle>Traffic Monitor</LayoutTitle>

          {/* 實時流量折線圖，有兩條線， in and out */}
        </LayoutBox>
      </LayoutColumn>

      <LayoutBox>
        <LayoutTitle>Connection Logs</LayoutTitle>
        <LayoutText>
          Consolidated log output from all modules. Filter by <b>module</b> and <b>level</b> to quickly debug or analyze
          events.
        </LayoutText>

        {/* 統整 log 資訊，可篩選模組與 level */}
      </LayoutBox>
    </LayoutRow>
  );
};

export { App };
