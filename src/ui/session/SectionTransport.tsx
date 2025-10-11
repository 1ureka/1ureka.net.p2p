import { Box, Typography } from "@mui/material";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardCopyButton } from "@/ui/session/SessionCardCopyBtn";
import { SessionCardLabel, SessionCardSubBody } from "@/ui/session/SessionCard";

import { useSession } from "@/transport-state/store";

const TransportHeader = () => {
  return (
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Transport
      </Typography>
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
