import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Typography } from "@mui/material";

import { useState } from "react";
import { centerTextSx } from "@/ui/theme";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { CardSubHeader } from "@/ui/components/Card";

import { TrafficChart } from "@/ui/session-metrics/ChartTraffic";
import { ConnectionsChart } from "@/ui/session-metrics/ChartConnections";
import { LiveMetricsPopover } from "@/ui/session-metrics/LiveMetricsPopover";

type MetricType = "connections" | "traffic";

const LiveMetrics = () => {
  const [metric, setMetric] = useState<MetricType>("traffic");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenPopover = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClosePopover = () => setAnchorEl(null);

  return (
    <>
      <CardSubHeader>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
          Live Metrics
        </Typography>

        <Box sx={{ flex: 1 }} />

        <GithubTooltip title="Select a chart">
          <GithubButton size="small" onClick={handleOpenPopover}>
            <Typography variant="body2" sx={{ textTransform: "capitalize", ...centerTextSx }}>
              {metric}
            </Typography>
            <ExpandMoreRoundedIcon fontSize="small" />
          </GithubButton>
        </GithubTooltip>
      </CardSubHeader>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mb: -2 }}>
        {metric === "traffic" && <TrafficChart />}
        {metric === "connections" && <ConnectionsChart />}
      </Box>

      <LiveMetricsPopover anchorEl={anchorEl} onClose={handleClosePopover} value={metric} onChange={setMetric} />
    </>
  );
};

export { LiveMetrics, type MetricType };
