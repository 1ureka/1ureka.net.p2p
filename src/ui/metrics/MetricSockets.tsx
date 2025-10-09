import CableRoundedIcon from "@mui/icons-material/CableRounded";

import { Box, Divider, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader, CardSubHeader } from "@/ui/components/Card";
import { SocketsChart } from "@/ui/metrics/MetricSocketsChart";

const SocketsCardBody = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "auto" }}>
      <CardSubHeader>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
          Active Connections
        </Typography>
        <Box sx={{ color: "text.secondary" }}>
          <CableRoundedIcon color="inherit" fontSize="small" sx={{ display: "block" }} />
        </Box>
      </CardSubHeader>

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
        <SocketsChart />
      </Box>
    </Box>
  );
};

const SocketsCard = () => (
  <Card sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
    <CardHeader>
      <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
        Sockets
      </Typography>
    </CardHeader>

    <SocketsCardBody />
  </Card>
);

export { SocketsCard };
