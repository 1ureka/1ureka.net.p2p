import { Box, Divider, Typography } from "@mui/material";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardCopyButton } from "@/ui/session/SessionCardCopyBtn";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useSession } from "@/transport-state/store";

const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" sx={{ color: "text.secondary", textWrap: "nowrap" }}>
    {children}
  </Typography>
);

const Value = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" sx={ellipsisSx}>
    {children}
  </Typography>
);

const TransportBody = () => {
  const session = useSession((state) => state.session);
  const status = useSession((state) => state.status);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 1.5, p: 2, px: 3 }}>
      <Label>Status</Label>
      <ConnectionIndicator status={status} />

      <Label>Host</Label>
      <Value>{session.host || "--"}</Value>

      <Label>Client</Label>
      <Value>{session.client || "--"}</Value>

      <Label>Session ID</Label>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Value>{session.id || "--"}</Value>
        {session.id && <SessionCardCopyButton />}
      </Box>

      <Label>Created at</Label>
      <Value>{session.createdAt ? new Date(session.createdAt).toLocaleString() : "--"}</Value>
    </Box>
  );
};

const TransportSection = () => (
  <>
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Transport
      </Typography>
    </CardSubHeader>
    <Divider />
    <TransportBody />
  </>
);

export { TransportSection };
