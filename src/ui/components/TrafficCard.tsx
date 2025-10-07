import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { Box, Typography } from "@mui/material";
import { create } from "zustand";

import { useTab } from "@/ui/tabs";
import { centerTextSx, theme } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

type Point = { timestamp: number; rate: number };

const useTraffic = create<{ points: ReadonlyArray<Point> }>((set) => {
  const maxMbps = 15;
  const intervalMs = 1000;

  const maxBytesPerSec = (maxMbps * 1_000_000) / 8;
  const maxBytesPerInterval = Math.floor((maxBytesPerSec * intervalMs) / 1000);

  function generatePoint(): Point {
    const t = Date.now();
    const base = Math.sin(t / 5000) * 0.5 + 0.5;
    const noise = (Math.random() - 0.5) * 0.3;
    let value = (base + noise) * maxBytesPerInterval;
    value = Math.max(0, Math.min(maxBytesPerInterval, value));
    return { timestamp: t, rate: Math.floor(value) };
  }

  setInterval(() => {
    set((state) => ({ points: [...state.points, generatePoint()] }));
  }, intervalMs);

  return { points: [] };
});

// --------------------------------------------

const createFormatter = (now: number) => {
  const formatElapsed = (timestamp: number) => {
    return `${Math.round((now - timestamp) / 1000)} s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return { formatElapsed, formatBytes };
};

const TrafficChart = () => {
  const points = useTraffic((state) => state.points);
  const now = Date.now();
  const { formatElapsed, formatBytes } = createFormatter(now);

  const xAxis: XAxis<"linear"> = {
    dataKey: "timestamp",
    min: now - 60000,
    max: now,
    valueFormatter: formatElapsed,
  };

  const yAxis: YAxis<"linear"> = {
    dataKey: "rate",
    valueFormatter: formatBytes,
  };

  const series: LineSeries = {
    dataKey: "rate",
    showMark: false,
    area: true,
    curve: "linear",
    color: theme.palette.primary.main,
    valueFormatter: formatBytes,
  };

  return (
    <LineChart
      dataset={points}
      xAxis={[xAxis]}
      yAxis={[yAxis]}
      series={[series]}
      height={250}
      grid={{ vertical: true, horizontal: true }}
      sx={{ "& .MuiAreaElement-root": { fill: "url(#Gradient)" }, mb: -2, ml: -1.5 }}
    >
      <linearGradient id="Gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

const TrafficCard = () => {
  const setTab = useTab((state) => state.setTab);

  return (
    <Card>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <Box sx={{ borderRight: (theme) => `2px solid ${theme.palette.divider}` }}>
          <CardHeader>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
              <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
                Egress
              </Typography>
              <FileUploadRoundedIcon color="inherit" fontSize="small" />
            </Box>
          </CardHeader>

          <TrafficChart />
        </Box>

        <Box>
          <CardHeader>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
              <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
                Ingress
              </Typography>
              <FileDownloadRoundedIcon color="inherit" fontSize="small" />
            </Box>

            <Box sx={{ flex: 1 }} />

            <GithubButton size="small" onClick={() => setTab("metrics")}>
              <QueryStatsRoundedIcon fontSize="small" />
              <Typography variant="body2" sx={centerTextSx}>
                Open metrics
              </Typography>
            </GithubButton>
          </CardHeader>

          <TrafficChart />
        </Box>
      </Box>
    </Card>
  );
};

export { TrafficCard };
