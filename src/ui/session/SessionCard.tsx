import StopRoundedIcon from "@mui/icons-material/StopRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Divider, Typography } from "@mui/material";

import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";

import { AdapterSection } from "@/ui/session/SectionAdapter";
import { TransportSection } from "@/ui/session/SectionTransport";
import { LiveMetrics } from "@/ui/session-metrics/LiveMetrics";
import { ConfirmPopover } from "@/ui/session/ConfirmPopover";

import { handleStop, handleLeave } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

const SessionCardHeader = () => {
  const role = useSession((state) => state.role);
  const status = useSession((state) => state.status);
  const instance = useAdapter((state) => state.instance);

  const stopLoading = status === "aborting";
  const stopDisabled = ["disconnected", "joining", "aborting", "failed"].includes(status);
  const leaveDisabled = status !== "failed" || instance !== null;

  const getStopTooltip = () => {
    if (stopDisabled) return "Session is already stopped";
    if (stopLoading) return "Stopping session...";
    return "Stop current session";
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpenPopover = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClosePopover = () => setAnchorEl(null);

  return (
    <CardHeader>
      <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
        <Typography variant="subtitle1" component="h2" sx={{ ...centerTextSx }}>
          Session
        </Typography>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", whiteSpace: "nowrap", ...centerTextSx }}>
          {`as ${role}`}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GithubTooltip title={getStopTooltip()}>
          <GithubIconButton disabled={stopDisabled} loading={stopLoading} onClick={handleOpenPopover}>
            <StopRoundedIcon fontSize="small" />
          </GithubIconButton>
        </GithubTooltip>

        {leaveDisabled ? (
          <GithubTooltip key="stop-session-first" title="Stop session first">
            <GithubIconButton disabled={leaveDisabled}>
              <LogoutRoundedIcon fontSize="small" />
            </GithubIconButton>
          </GithubTooltip>
        ) : (
          <GithubTooltip
            key="leave-session"
            open
            arrow
            title="Your session has stopped. Leave to retry or start a new session."
          >
            <GithubIconButton onClick={handleLeave}>
              <LogoutRoundedIcon fontSize="small" />
            </GithubIconButton>
          </GithubTooltip>
        )}
      </Box>

      <ConfirmPopover
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        onConfirm={async () => handleStop()}
        title="Stop session?"
        message="This will stop the current connection and end the session. You can create or join a new session afterwards."
      />
    </CardHeader>
  );
};

const SessionCard = () => (
  <Card sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
    <SessionCardHeader />
    <AdapterSection />
    <Divider />
    <TransportSection />
    <Divider />
    <LiveMetrics />
  </Card>
);

export { SessionCard };
