import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Typography } from "@mui/material";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardLabel, SessionCardSubBody } from "@/ui/session/SessionCard";

import { handleStartHostAdapter, handleStartClientAdapter, handleStopAdapter } from "@/adapter-state/handlers";
import { useSession } from "@/transport-state/store";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

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
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Adapter
      </Typography>

      <Box sx={{ flex: 1 }} />

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
    </CardSubHeader>
  );
};

const AdapterBody = () => {
  const instance = useAdapter((state) => state.instance);
  const sockets = useAdapter((state) => state.sockets);
  const status = instance ? "connected" : "failed";

  return (
    <SessionCardSubBody>
      <SessionCardLabel>Status</SessionCardLabel>
      <ConnectionIndicator status={status} />

      <SessionCardLabel>Connections</SessionCardLabel>
      <Typography variant="body2" sx={ellipsisSx}>
        {instance ? `${sockets.length} logical sockets active` : "--"}
      </Typography>
    </SessionCardSubBody>
  );
};

export { AdapterHeader, AdapterBody };
