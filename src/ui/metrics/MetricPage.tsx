import { memo } from "react";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import { Box, Typography } from "@mui/material";

import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { TrafficCard } from "@/ui/metrics/MetricTraffic";
import { SocketsCard } from "@/ui/metrics/MetricSockets";

const containerSx = {
  gap: 2,
  px: 4,
  py: 3,
  minHeight: 650,
  flex: 1,
  display: "grid",
  gridTemplateRows: "1fr 1.2fr",
  gridTemplateColumns: "1fr 1fr",
  "& > div:nth-of-type(1)": { gridArea: "1 / 1 / 2 / 2" },
  "& > div:nth-of-type(2)": { gridArea: "1 / 2 / 2 / 3" },
  "& > div:nth-of-type(3)": { gridArea: "2 / 1 / 3 / 3" },
};

const MetricPage = memo(() => (
  <Box sx={containerSx}>
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <CardHeader>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AnalyticsRoundedIcon />
          <Typography variant="subtitle1" component="h2" sx={centerTextSx}>
            Metrics
          </Typography>
        </Box>
      </CardHeader>

      <Box sx={{ p: 2, display: "grid", placeItems: "center", textAlign: "center", flex: 1 }}>
        <Box sx={{ maxWidth: 450 }}>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
            This section is currently under development.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This section will provide detailed statistics about your connections, including bandwidth usage, latency
            measurements, and connection quality metrics.
          </Typography>
        </Box>
      </Box>
    </Card>

    <SocketsCard />
    <TrafficCard />
  </Box>
));

MetricPage.displayName = "MetricPage";

export { MetricPage };
