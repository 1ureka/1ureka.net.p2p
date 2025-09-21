import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Button, Paper, Typography } from "@mui/material";
import { buttonContainedSx, buttonWithStartIconSx } from "./utils";
import { useFormStore } from "@/store/form";
import { useWebRTC } from "@/store/webrtc";
import { useBridge } from "@/store/bridge";

type Status = "connected" | "disconnected" | "connecting" | "failed";
const StatusIndicator = ({ module, status }: { module: string; status: Status }) => {
  const statusMap: Record<Status, { color: string; text: string }> = {
    connected: { color: "#4caf50", text: "已連接" },
    failed: { color: "#f44336", text: "連接失敗" },
    connecting: { color: "#ff9800", text: "連接中..." },
    disconnected: { color: "#9e9e9e", text: "未連接" },
  } as const;

  const { color, text } = statusMap[status];
  const containerSx = { bgcolor: "divider", borderRadius: 2, p: 1, px: 2 };
  const containerLayoutSx = { display: "flex", alignItems: "center", gap: 2 };

  return (
    <Box sx={{ ...containerSx, ...containerLayoutSx }}>
      <Box
        sx={{
          width: 12,
          aspectRatio: "1/1",
          borderRadius: 99,
          bgcolor: color,
          position: "relative",
          animation: "ping 1.5s ease-in-out infinite",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            bgcolor: color,
            opacity: 0.5,
            animation: "ping-ring 1.5s ease-in-out infinite",
          },
          "@keyframes ping": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.5 },
          },
          "@keyframes ping-ring": {
            "0%": { transform: "scale(1)", opacity: 0.9 },
            "100%": { transform: "scale(2.5)", opacity: 0 },
          },
        }}
      />
      <Box>
        <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
          {module} 連接狀態
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

const Footer = () => {
  const current = useFormStore((state) => state.current);
  const steps = useFormStore((state) => state.steps);
  const nextStep = useFormStore((state) => state.nextStep);
  const prevStep = useFormStore((state) => state.prevStep);
  const webrtcStatus = useWebRTC((state) => state.status);
  const tcpStatus = useBridge((state) => state.status);

  return (
    <Paper
      elevation={6}
      sx={{
        position: "relative",
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: "1fr auto 1fr",
        p: 2.5,
        px: 5,
        borderRadius: (theme) => `${theme.spacing(5)} ${theme.spacing(5)} 0 0`,
        mt: 2.5,
      }}
    >
      <Box>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          sx={buttonWithStartIconSx}
          onClick={prevStep}
          disabled={current === 0}
        >
          回到上一步
        </Button>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <StatusIndicator module="WebRTC" status={webrtcStatus} />
        <StatusIndicator module="Bridge" status={tcpStatus} />
      </Box>

      <Box sx={{ justifySelf: "flex-end" }}>
        <Button
          variant="contained"
          disableElevation
          sx={buttonContainedSx}
          onClick={nextStep}
          disabled={current === steps.length - 1}
        >
          下一步
        </Button>
      </Box>
    </Paper>
  );
};

export { Footer };
