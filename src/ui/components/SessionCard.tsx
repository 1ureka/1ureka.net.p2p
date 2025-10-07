import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Divider, Typography } from "@mui/material";

import { centerTextSx, ellipsisSx, generateColorMix } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubHeaderButton, GithubIconButton, GithubTooltip } from "@/ui/components/Github";
import { ConnectionIndicator } from "@/ui/components/SessionCardIndicator";
import { SessionCardCopyButton } from "@/ui/components/SessionCardCopyBtn";

import { handleStartHostAdapter, handleStartClientAdapter, handleStopAdapter } from "@/adapter-state/handlers";
import { handleLeave, handleStop } from "@/transport-state/handlers";
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

const SessionCardSubHeader = ({ children }: { children: React.ReactNode }) => {
  const bgcolor = ({ palette }: { palette: { background: { paper: string; default: string } } }) =>
    generateColorMix(palette.background.paper, palette.background.default, 50);

  return (
    <Box sx={{ borderBottom: "2px solid", borderColor: "divider", bgcolor }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40, pl: 2, pr: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

const SessionCardSubBody = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 1.5, p: 2, px: 3 }}>{children}</Box>
);

// ------------------------------------------------------------------------------

// TODO: error display
const AdapterHeader = () => {
  const instance = useAdapter((state) => state.instance);
  const role = useSession((state) => state.role);

  const [startState, setStartState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  const handleStart = async () => {
    try {
      setStartState({ loading: true, error: null });
      if (role === "host") await handleStartHostAdapter();
      if (role === "client") await handleStartClientAdapter();
      throw new Error("Role is not set");
    } catch (err) {
      setStartState({ loading: false, error: err instanceof Error ? err.message : "Unknown error occurred" });
    } finally {
      setStartState({ loading: false, error: null });
    }
  };

  const [stopState, setStopState] = useState<{ loading: boolean }>({ loading: false });

  const handleStop = async () => {
    try {
      setStopState({ loading: true });
      await handleStopAdapter();
    } finally {
      setStopState({ loading: false });
    }
  };

  return (
    <SessionCardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Adapter
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GithubTooltip title={"Start adapter"}>
          <GithubIconButton disabled={instance !== null} loading={startState.loading} onClick={handleStart}>
            <PlayArrowRoundedIcon fontSize="small" />
          </GithubIconButton>
        </GithubTooltip>

        <GithubTooltip title={"Stop adapter"}>
          <GithubIconButton disabled={instance === null} loading={stopState.loading} onClick={handleStop}>
            <StopRoundedIcon fontSize="small" />
          </GithubIconButton>
        </GithubTooltip>
      </Box>
    </SessionCardSubHeader>
  );
};

const AdapterBody = () => {
  const instance = useAdapter((state) => state.instance);
  const mappings = useAdapter((state) => state.mappings);
  const rules = useAdapter((state) => state.rules);
  const status = instance ? "connected" : "failed";

  return (
    <SessionCardSubBody>
      <SessionCardLabel>Status</SessionCardLabel>
      <ConnectionIndicator status={status} />

      <SessionCardLabel>Configs</SessionCardLabel>
      <Typography variant="body2" sx={ellipsisSx}>
        {instance ? (instance === "host" ? `${rules.length} rules` : `${mappings.length} mappings`) : "--"}
      </Typography>
    </SessionCardSubBody>
  );
};

const TransportHeader = () => {
  const status = useSession((state) => state.status);
  const stopLoading = status === "aborting";
  const stopDisabled = ["disconnected", "joining", "aborting", "failed"].includes(status);

  return (
    <SessionCardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Transport
      </Typography>

      <GithubTooltip title={"Stop connection"}>
        <GithubIconButton disabled={stopDisabled} loading={stopLoading} onClick={() => handleStop()}>
          <StopRoundedIcon fontSize="small" />
        </GithubIconButton>
      </GithubTooltip>
    </SessionCardSubHeader>
  );
};

const TransportBody = () => {
  const session = useSession((state) => state.session);
  const status = useSession((state) => state.status);

  return (
    <SessionCardSubBody>
      <SessionCardLabel>Status</SessionCardLabel>
      <ConnectionIndicator status={status} />

      <SessionCardLabel>Host</SessionCardLabel>
      <Typography variant="body2" sx={ellipsisSx}>
        {session.host || "--"}
      </Typography>

      <SessionCardLabel>Client</SessionCardLabel>
      <Typography variant="body2" sx={ellipsisSx}>
        {session.client || "--"}
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
    </SessionCardSubBody>
  );
};

// ------------------------------------------------------------------------------

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
  <Card>
    <SessionCardHeader />
    <AdapterHeader />
    <AdapterBody />
    <Divider sx={{ borderWidth: 1, borderColor: "divider" }} />
    <TransportHeader />
    <TransportBody />
  </Card>
);

export { SessionCard };
