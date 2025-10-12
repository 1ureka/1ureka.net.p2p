import { Box, Typography } from "@mui/material";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";

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

const AdapterBody = () => {
  const instance = useAdapter((state) => state.instance);
  const sockets = useAdapter((state) => state.sockets);
  const status = instance ? "connected" : "failed";

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "0.3fr 1fr", gap: 1.5, p: 2, px: 3 }}>
      <Label>Status</Label>
      <ConnectionIndicator status={status} />

      <Label>Connections</Label>
      <Value>{instance ? `${sockets.length} logical sockets active` : "--"}</Value>
    </Box>
  );
};

const AdapterSection = () => (
  <>
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Adapter
      </Typography>
    </CardSubHeader>
    <AdapterBody />
  </>
);

export { AdapterSection };
