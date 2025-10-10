import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Typography } from "@mui/material";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubIconButton, GithubTooltip } from "@/ui/components/Github";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardLabel, SessionCardSubBody } from "@/ui/session/SessionCard";
import { ConfirmPopover } from "@/ui/session/ConfirmPopover";

import { handleStopAdapter } from "@/adapter-state/handlers";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

// TODO: error display
const AdapterHeader = () => {
  const instance = useAdapter((state) => state.instance);
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
        Adapter
      </Typography>

      <Box sx={{ flex: 1 }} />

      <GithubTooltip title={"Stop adapter"}>
        <GithubIconButton disabled={instance === null || anchorEl !== null} onClick={handleOpenPopover}>
          <StopRoundedIcon fontSize="small" />
        </GithubIconButton>
      </GithubTooltip>

      <ConfirmPopover
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        onConfirm={handleStopAdapter}
        title="Stop Adapter"
        message="This operation should only be done after confirming the session will be closed. To exit, both the Adapter and Transport must be shut down."
      />
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
