import StopRoundedIcon from "@mui/icons-material/StopRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Divider, Typography } from "@mui/material";

import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";

import { AdapterSection } from "@/ui/session/SectionAdapter";
import { TransportSection } from "@/ui/session/SectionTransport";
import { TrafficHeader, TrafficBody } from "@/ui/session/SectionTraffic";
import { ConfirmPopover } from "@/ui/session/ConfirmPopover";

import { handleStop, handleLeave } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

const SessionCardLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <Typography variant="body2" sx={{ color: "text.secondary", textWrap: "nowrap" }}>
      {children}
    </Typography>
  );
};

const SessionCardSubBody = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 1.5, p: 2, px: 3 }}>{children}</Box>
);

export { SessionCardLabel, SessionCardSubBody };

// -------------------------------------------------------------------------------------------------

const SessionCardHeader = () => {
  const role = useSession((state) => state.role);
  const status = useSession((state) => state.status);
  const instance = useAdapter((state) => state.instance);

  const stopLoading = status === "aborting";
  const stopDisabled = ["disconnected", "joining", "aborting", "failed"].includes(status);
  const leaveDisabled = status !== "failed" || instance !== null;

  const getStopTooltip = () => {
    if (stopDisabled) return "Connection is already stopped";
    if (stopLoading) return "Stopping connection...";
    return "Stop connection";
  };
  const getLeaveTooltip = () => {
    if (leaveDisabled) return "Stop connection first";
    return "Leave session";
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
        <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
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

        <GithubTooltip title={getLeaveTooltip()}>
          <GithubIconButton disabled={leaveDisabled} onClick={handleLeave}>
            <LogoutRoundedIcon fontSize="small" />
          </GithubIconButton>
        </GithubTooltip>
      </Box>

      <ConfirmPopover
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        onConfirm={async () => handleStop()}
        title="Stop connection?"
        message="This connection will be permanently stopped. You can join or create a new session later if needed."
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
    <TrafficHeader />
    <Divider />
    <TrafficBody />
  </Card>
);

export { SessionCard };
