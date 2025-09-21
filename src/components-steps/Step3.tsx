import { Box, Button } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import { useFormStore } from "@/store/form";
import { useBridge } from "@/store/bridge";

import { buttonContainedSx } from "@/components/utils";
import { StepDescription } from "./StepDescription";
import { StepInput } from "./StepInput";
import { Step3Logs } from "./Step3Logs";

const Step3 = () => {
  const { status, history } = useBridge();
  const role = useFormStore((state) => state.role);
  const port = useFormStore((state) => state.tcpPort);
  const portError = useFormStore((state) => state.tcpPortError);
  const setPort = useFormStore((state) => state.setTcpPort);

  const handleConnect = () => {
    if (portError) return;
    window.electron.send(`bridge.start.${role}`, Number(port));
  };

  return (
    <Box sx={{ width: 1, height: 1, display: "grid", gridTemplateRows: "auto 1fr", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 3, alignItems: "flex-end" }}>
        <StepDescription
          title="TCP 連接"
          description={
            role === "host"
              ? "請輸入你的本地服務正在監聽的 TCP 連接埠，開始連線並且 WebRTC 也連線成功後，就會將遠端流量轉發到這個連接埠。"
              : "請輸入你的本地應用客戶端需要連接的 TCP 連接埠，開始連線並且 WebRTC 也連線成功後，就會將流量轉發到遠端 TCP 服務。"
          }
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "stretch" }}>
          <StepInput
            value={port}
            onChange={(value) => setPort(value)}
            disabled={status === "connecting" || status === "connected"}
            placeholder={role === "host" ? "本地服務監聽的連接埠 (e.g. 9000)" : "本地應用需要連接的連接埠 (e.g. 9000)"}
            error={!!portError}
          />

          <Button
            onClick={handleConnect}
            loading={status === "connecting"}
            disabled={status === "connecting" || status === "connected" || !!portError}
            sx={{ ...buttonContainedSx, width: "auto", minWidth: 0 }}
            variant="contained"
          >
            <SendRoundedIcon />
          </Button>
        </Box>
      </Box>

      <Step3Logs history={history} />
    </Box>
  );
};

export { Step3 };
