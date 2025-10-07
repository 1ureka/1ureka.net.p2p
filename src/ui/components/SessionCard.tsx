import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Button, Typography } from "@mui/material";

import { ellipsisSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubHeaderButton, GithubTooltip } from "@/ui/components/Github";
import { ConnectionIndicator } from "@/ui/components/SessionCardIndicator";

import { handleLeave, handleStop } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";

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
        <ConnectionIndicator status={status} />

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
