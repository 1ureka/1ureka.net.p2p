import { Box, Typography } from "@mui/material";
import { Card, CardHeader } from "@/ui/components/Card";
import { SocketsChart } from "@/ui/metrics/MetricSocketsChart";

const SocketsCard = () => (
  <Card sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
    <CardHeader>
      <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
        Active Connections
      </Typography>
    </CardHeader>

    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
      <SocketsChart />
    </Box>
  </Card>
);

export { SocketsCard };
