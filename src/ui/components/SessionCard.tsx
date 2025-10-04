import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, Typography } from "@mui/material";

import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useTabs } from "@/ui/tabs";
import type { ConnectionStatus } from "@/utils";

const colorMap: Record<ConnectionStatus, string> = {
  connected: "#4caf50",
  failed: "#f44336",
  connecting: "#ff9800",
  disconnected: "#9e9e9e",
} as const;

const ConnectionIndicator = ({ status }: { status: ConnectionStatus }) => (
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

const SessionCardLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <Typography variant="body2" sx={{ color: "text.secondary", textWrap: "nowrap" }}>
      {children}
    </Typography>
  );
};

const SessionCardCopyButton = () => {
  return (
    <Box sx={{ color: "text.secondary", translate: "0px -1.5px", height: 0, display: "grid", placeItems: "center" }}>
      <Button sx={{ m: 0, p: 0.5, minWidth: 0, height: 0, opacity: 0 }} color="inherit">
        <ContentCopyRoundedIcon fontSize="small" />
      </Button>

      <Button sx={{ position: "absolute", m: 0, p: 0.5, minWidth: 0 }} color="inherit">
        <ContentCopyRoundedIcon fontSize="small" />
      </Button>
    </Box>
  );
};

const SessionCard = () => {
  const launch = useTabs((state) => state.launch);

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Session
        </Typography>

        <Box sx={{ flex: 1 }} />

        <GithubButton
          sx={{ py: 0.5, px: 1, bgcolor: "background.default" }}
          startIcon={<LogoutRoundedIcon fontSize="small" color="error" />}
          onClick={() => launch(false)}
        >
          <Typography
            variant="button"
            sx={{ textTransform: "none", textWrap: "nowrap", color: "error.main", ...centerTextSx }}
          >
            leave
          </Typography>
        </GithubButton>
      </CardHeader>

      <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 2, p: 2.5, px: 3 }}>
        <SessionCardLabel>Status</SessionCardLabel>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ConnectionIndicator status="connected" />
          <Typography variant="body2" sx={{ color: "success.main", ...ellipsisSx }}>
            Connected
          </Typography>
        </Box>

        <SessionCardLabel>Host</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          Laptop-Z1FK8
        </Typography>

        <SessionCardLabel>Client</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          --
        </Typography>

        <SessionCardLabel>Session ID</SessionCardLabel>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={ellipsisSx}>
            123e4567-e89b-12d3-a456-426614174000
          </Typography>
          <SessionCardCopyButton />
        </Box>

        <SessionCardLabel>Created at</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Card>
  );
};

export { SessionCard };
