import { Divider, Typography } from "@mui/material";
import { CardSubHeader } from "@/ui/components/Card";
import { ConnectionIndicator } from "@/ui/session/SessionCardIndicator";
import { SessionCardLabel, SessionCardSubBody } from "@/ui/session/SessionCard";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";

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

const AdapterSection = () => (
  <>
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Adapter
      </Typography>
    </CardSubHeader>
    <Divider />
    <AdapterBody />
  </>
);

export { AdapterSection };
