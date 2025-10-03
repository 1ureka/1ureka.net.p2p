import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import { Box, Typography } from "@mui/material";
import { create } from "zustand";

import { Card, CardHeader } from "@/ui/components/Card";
import { LineChart } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";

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

const TrafficChart = () => {
  const points = useTraffic((state) => state.points);

  const now = Date.now();
  const recentPoints = points.filter((p) => p.timestamp >= now - 60000);

  return (
    <LineChart
      dataset={recentPoints}
      xAxis={[
        {
          dataKey: "timestamp",
          scaleType: "linear",
          min: now - 60000,
          max: now,
          valueFormatter: (v: number) => `${Math.round((now - v) / 1000)} s`, // 距離現在經過多久
        },
      ]}
      yAxis={[
        {
          valueFormatter: (v: number) => `${(v / 1024).toFixed(1)} KB`, // 把 bytes 轉成 KB
        },
      ]}
      series={[
        {
          dataKey: "rate",
          showMark: false,
          area: true,
          curve: "linear",
          color: theme.palette.primary.main,
          valueFormatter: (v: number) => `${(v / 1024).toFixed(1)} KB`, // tooltip 顯示
        },
      ]}
      height={250}
      grid={{ vertical: true, horizontal: true }}
      sx={{ "& .MuiAreaElement-root": { fill: "url(#Gradient)" } }}
    >
      <linearGradient id="Gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

const TrafficCard = () => {
  return (
    <Card>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <Box>
          <CardHeader>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
              <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
                Egress
              </Typography>
              <FileUploadRoundedIcon color="inherit" />
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
              <FileDownloadRoundedIcon color="inherit" />
            </Box>
          </CardHeader>

          <TrafficChart />
        </Box>
      </Box>
    </Card>
  );
};

export { TrafficCard };
