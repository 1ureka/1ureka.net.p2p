import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Button, Typography } from "@mui/material";

import { ellipsisSx } from "@/ui/theme";
import { GithubHeaderButton, GithubTooltip } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { type ConnectionStatus, useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";
import { handleLeave, handleStop } from "@/transport-state/handlers";

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
  const role = useSession((state) => state.role);
  const session = useSession((state) => state.session);
  const status = useSession((state) => state.status);
  const instance = useAdapter((state) => state.instance);

  const stopLoading = status === "aborting";
  const stopDisabled = ["disconnected", "joining", "aborting", "failed"].includes(status);
  const leaveDisabled = status !== "failed" || instance !== null;
  const statusString = status === "failed" ? "Stopped" : status.charAt(0).toUpperCase() + status.slice(1);

  const getStopTooltip = () => {
    if (status === "disconnected") return "Not connected to session";
    if (status === "joining") return "Joining session";
    if (status === "aborting") return "Stopping connection";
    if (status === "failed") return "Connection stopped";
    return "";
  };

  const getLeaveTooltip = () => {
    if (status !== "failed") return "Stop connection first";
    if (instance !== null) return "Close adapter first";
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Session
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GithubTooltip title={getStopTooltip()}>
            <GithubHeaderButton
              color="warning"
              StartIcon={StopRoundedIcon}
              disabled={stopDisabled}
              loading={stopLoading}
              onClick={() => handleStop()}
            >
              stop
            </GithubHeaderButton>
          </GithubTooltip>

          <GithubTooltip title={getLeaveTooltip()}>
            <GithubHeaderButton
              color="error"
              StartIcon={LogoutRoundedIcon}
              disabled={leaveDisabled}
              onClick={() => handleLeave()}
            >
              leave
            </GithubHeaderButton>
          </GithubTooltip>
        </Box>
      </CardHeader>

      <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 2, p: 2.5, px: 3 }}>
        <SessionCardLabel>Status</SessionCardLabel>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ConnectionIndicator status={status} />
          <Typography variant="body2" sx={{ color: colorMap[status], ...ellipsisSx }}>
            {statusString}
          </Typography>
        </Box>

        <SessionCardLabel>Host</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          {session.host || "--"}
          {role === "host" ? " (You)" : ""}
        </Typography>

        <SessionCardLabel>Client</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          {session.client || "--"}
          {role === "client" ? " (You)" : ""}
        </Typography>

        <SessionCardLabel>Session ID</SessionCardLabel>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={ellipsisSx}>
            {session.id || "--"}
          </Typography>
          <SessionCardCopyButton />
        </Box>

        <SessionCardLabel>Created at</SessionCardLabel>
        <Typography variant="body2" sx={ellipsisSx}>
          {new Date(session.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </Card>
  );
};

export { SessionCard };
