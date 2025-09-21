import { Box, Button } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import { createWebRTC } from "@/native/webrtc";
import { useWebRTC } from "@/store/webrtc";
import { useFormStore } from "@/store/form";

import { buttonContainedSx } from "../utils";
import { StepDescription } from "./StepDescription";
import { StepInput } from "./StepInput";
import { Step2Logs } from "./Step2Logs";

const Step2 = () => {
  const { status, history } = useWebRTC();
  const role = useFormStore((state) => state.role);
  const code = useFormStore((state) => state.webrtcCode);
  const codeError = useFormStore((state) => state.webrtcCodeError);
  const setCode = useFormStore((state) => state.setWebRTCCode);

  const handleConnect = () => {
    if (codeError) return;
    createWebRTC(role, code);
  };

  return (
    <Box sx={{ width: 1, height: 1, display: "grid", gridTemplateRows: "auto 1fr", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 3, alignItems: "flex-end" }}>
        <StepDescription
          title="WebRTC 連接"
          description="請輸入連接代碼，這將會作為你們連接的憑證，然後建立 P2P 連接。"
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "stretch" }}>
          <StepInput
            value={code}
            onChange={(value) => setCode(value)}
            disabled={status === "connecting" || status === "connected"}
            placeholder={role === "host" ? "輸入您要創建的連接代碼" : "輸入主持方提供的連接代碼"}
            error={!!codeError}
          />

          <Button
            onClick={handleConnect}
            loading={status === "connecting"}
            disabled={status === "connecting" || status === "connected" || !!codeError}
            sx={{ ...buttonContainedSx, width: "auto", minWidth: 0 }}
            variant="contained"
          >
            <SendRoundedIcon />
          </Button>
        </Box>
      </Box>

      <Step2Logs history={history} />
    </Box>
  );
};

export { Step2 };
