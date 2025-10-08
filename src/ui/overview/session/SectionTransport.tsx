import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Typography } from "@mui/material";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";
import { ConnectionIndicator } from "@/ui/overview/session/SessionCardIndicator";
import { SessionCardCopyButton } from "@/ui/overview/session/SessionCardCopyBtn";
import { SessionCardLabel, SessionCardSubHeader, SessionCardSubBody } from "@/ui/overview/session/SessionCard";

import { handleStop } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";

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

export { TransportHeader, TransportBody };
