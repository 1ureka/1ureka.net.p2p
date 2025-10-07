import { Box, Typography } from "@mui/material";
import type { ConnectionStatus } from "@/transport-state/store";
import { ellipsisSx } from "@/ui/theme";

const green = "#4caf50";
const red = "#f44336";
const orange = "#ff9800";
const gray = "#9e9e9e";

const colorMap: Record<ConnectionStatus, string> = {
  disconnected: gray,
  joining: orange,
  waiting: orange,
  signaling: orange,
  connected: green,
  aborting: red,
  failed: red,
} as const;

const ConnectionIndicatorDot = ({ status }: { status: ConnectionStatus }) => (
  <Box sx={{ display: "grid", placeItems: "center", height: 0, translate: "0px -1.5px" }}>
    <Box
      sx={{
        width: 12,
        aspectRatio: "1/1",
        borderRadius: 99,
        bgcolor: colorMap[status],
        position: "absolute",
        animation: "ping 1.5s ease-in-out infinite",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: 99,
          bgcolor: colorMap[status],
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
  </Box>
);

const formatStatus = (status: ConnectionStatus) => {
  return status === "failed" ? "Stopped" : status.charAt(0).toUpperCase() + status.slice(1);
};

const ConnectionIndicator = ({ status }: { status: ConnectionStatus }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <ConnectionIndicatorDot status={status} />
    <Typography variant="body2" sx={{ color: colorMap[status], ...ellipsisSx }}>
      {formatStatus(status)}
    </Typography>
  </Box>
);

export { ConnectionIndicator };
