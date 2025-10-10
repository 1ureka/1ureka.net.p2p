import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardCopyButton } from "@/ui/session/SessionCardCopyBtn";
import { SessionCardLabel, SessionCardSubBody } from "@/ui/session/SessionCard";
import { ConfirmPopover } from "@/ui/session/ConfirmPopover";

import { handleStop } from "@/transport-state/handlers";
import { useSession } from "@/transport-state/store";

const TransportHeader = () => {
  const status = useSession((state) => state.status);
  const stopLoading = status === "aborting";
  const stopDisabled = ["disconnected", "joining", "aborting", "failed"].includes(status);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  return (
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Transport
      </Typography>

      <Box sx={{ flex: 1 }} />

      <GithubTooltip title={"Stop connection"}>
        <GithubIconButton disabled={stopDisabled} loading={stopLoading} onClick={handleOpenPopover}>
          <StopRoundedIcon fontSize="small" />
        </GithubIconButton>
      </GithubTooltip>

      <ConfirmPopover
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        onConfirm={async () => handleStop()}
        title="Stop Transport"
        message="This operation should only be done after confirming the session will be closed. To exit, both the Adapter and Transport must be shut down."
      />
    </CardSubHeader>
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
