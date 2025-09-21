import { useState } from "react";
import { Box, Typography } from "@mui/material";

import { createWebRTC, type Role } from "@/native/webrtc";
import { useWebRTC } from "@/store/webrtc";

import { RoleCard } from "./step1/RoleCard";
import { CodeInput } from "./step1/CodeInput";
import { ConnectButton } from "./step1/ConnectButton";
import { ProgressDisplay } from "./step1/ProgressDisplay";

const Step1 = () => {
  const [role, setRole] = useState<Role>("host");
  const [code, setCode] = useState<{ content: string; error: boolean }>({ content: "", error: false });
  const { status, history, error } = useWebRTC();

  const handleConnect = async () => {
    if (code.content.trim().length === 0) {
      setCode((prev) => ({ ...prev, error: true }));
      return;
    }
    await createWebRTC(role, code.content.trim());
  };

  return (
    <Box sx={{ width: 1, height: 1, display: "grid", gridTemplateColumns: "1fr 0.5fr", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 3, height: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 1 }}>
            WebRTC 連接
          </Typography>
          <Typography variant="body2" color="text.secondary">
            選擇您的角色並輸入連接代碼，然後建立 P2P 連接。
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr auto", gap: 2 }}>
          <RoleCard role={"host"} selected={role === "host"} onClick={() => setRole("host")} />
          <RoleCard role={"client"} selected={role === "client"} onClick={() => setRole("client")} />

          <CodeInput
            value={code.content}
            onChange={(value) => setCode({ content: value, error: false })}
            disabled={status === "connecting" || status === "connected"}
            placeholder={role === "host" ? "輸入您要創建的連接代碼" : "輸入主持方提供的連接代碼"}
            error={code.error}
          />
          <ConnectButton
            loading={status === "connecting"}
            disabled={status === "connecting" || status === "connected"}
            onClick={handleConnect}
          />
        </Box>
      </Box>

      <ProgressDisplay history={history} />
    </Box>
  );
};

export { Step1 };
