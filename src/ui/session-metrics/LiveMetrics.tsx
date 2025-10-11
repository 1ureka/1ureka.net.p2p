import ReadMoreRoundedIcon from "@mui/icons-material/ReadMoreRounded";
import { Box, Divider, Typography } from "@mui/material";

import { useTab } from "@/ui/tabs";
import { centerTextSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { CardSubHeader } from "@/ui/components/Card";
import { TrafficChart } from "@/ui/session-metrics/TrafficChart";

const LiveMetricsHeader = () => {
  const setTab = useTab((state) => state.setTab);

  return (
    <CardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Live Metrics
      </Typography>

      <Box sx={{ flex: 1 }} />

      <GithubButton size="small" onClick={() => setTab("metrics")}>
        <Typography variant="body2" sx={centerTextSx}>
          Details
        </Typography>
        <ReadMoreRoundedIcon fontSize="small" />
      </GithubButton>
    </CardSubHeader>
  );
};

const LiveMetrics = () => (
  <>
    <LiveMetricsHeader />
    <Divider />
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mb: -2 }}>
      <TrafficChart />
    </Box>
  </>
);

export { LiveMetrics };
