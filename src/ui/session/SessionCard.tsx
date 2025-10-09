import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Divider, Typography } from "@mui/material";

import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { AdapterHeader, AdapterBody } from "@/ui/session/SectionAdapter";
import { TransportHeader, TransportBody } from "@/ui/session/SectionTransport";
import { TrafficHeader, TrafficBody } from "@/ui/session/SectionTraffic";

import { handleLeave } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";

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
  const leaveDisabled = status !== "failed" || instance !== null;

  const getLeaveTooltip = () => {
    if (status !== "failed") return "Stop connection first";
    if (instance !== null) return "Close adapter first";
    return "";
  };

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
        <GithubTooltip title={getLeaveTooltip()}>
          <GithubButton size="small" color="error" disabled={leaveDisabled} onClick={handleLeave}>
            <LogoutRoundedIcon fontSize="small" />
            <Typography variant="body2" sx={{ ...centerTextSx }}>
              Leave
            </Typography>
          </GithubButton>
        </GithubTooltip>
      </Box>
    </CardHeader>
  );
};

const SessionCard = () => (
  <Card sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
    <SessionCardHeader />

    <AdapterHeader />
    <Divider />
    <AdapterBody />

    <Divider />

    <TransportHeader />
    <Divider />
    <TransportBody />

    <Divider />

    <TrafficHeader />
    <Divider />
    <TrafficBody />
  </Card>
);

export { SessionCard };
