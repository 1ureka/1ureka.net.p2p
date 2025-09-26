import type { ConnectionStatus } from "@/store/type";
import { Box } from "@mui/material";

const colorMap: Record<ConnectionStatus, string> = {
  connected: "#4caf50",
  failed: "#f44336",
  connecting: "#ff9800",
  disconnected: "#9e9e9e",
} as const;

const ConnectionIndicator = ({ status }: { status: ConnectionStatus }) => (
  <Box sx={{ display: "grid", placeItems: "center", width: 32 }}>
    <Box
      sx={{
        width: 12,
        aspectRatio: "1/1",
        borderRadius: 99,
        bgcolor: colorMap[status],
        position: "relative",
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

export { ConnectionIndicator };
