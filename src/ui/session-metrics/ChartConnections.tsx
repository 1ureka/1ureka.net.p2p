import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { create } from "zustand";

const MAX_AGE_MS = 60000;
const INTERVAL_MS = 1000;
const INTERVAL_FILTER_MS = 60000;
type SocketsPoint = { timestamp: number; count: number };

const useSocketPoints = create<{ points: SocketsPoint[] }>((set) => {
  let counts = 0;
  let lastFilter = Date.now();

  useAdapter.subscribe((curr, prev) => {
    if (curr.sockets !== prev.sockets) counts = curr.sockets.length;
  });

  setInterval(() => {
    const now = Date.now();
    const point = { timestamp: now, count: counts };

    set((state) => {
      const shouldFilter = now - lastFilter >= INTERVAL_FILTER_MS; // prevent animation jitter

      if (shouldFilter) {
        lastFilter = now;
        const cutoffTime = now - MAX_AGE_MS;
        const filtered = state.points.filter((p) => p.timestamp >= cutoffTime);
        return { points: [...filtered, point] };
      }

      return { points: [...state.points, point] };
    });
  }, INTERVAL_MS);

  return { points: [] };
});

const ConnectionsChart = () => {
  const points = useSocketPoints((state) => state.points);
  const color = theme.palette.info.main;
  const now = Date.now();

  const formatElapsed = (timestamp: number) => {
    return `${Math.round((now - timestamp) / 1000)} s`;
  };

  const xAxis: XAxis<"linear"> = {
    dataKey: "timestamp",
    min: now - 60000,
    max: now,
    valueFormatter: formatElapsed,
  };

  const yAxis: YAxis<"linear"> = {
    dataKey: "count",
    width: 20,
    min: 0,
  };

  const series: LineSeries = {
    id: "connections",
    label: "Connections",
    dataKey: "count",
    showMark: false,
    area: true,
    curve: "linear",
    color,
    valueFormatter: (value) => `${value} sockets`,
    labelMarkType: "square",
  };

  return (
    <LineChart
      dataset={points}
      xAxis={[xAxis]}
      yAxis={[yAxis]}
      series={[series]}
      grid={{ vertical: true, horizontal: true }}
      slotProps={{
        legend: {
          direction: "vertical",
          sx: { gap: 3.5, ml: 0, ".MuiChartsLegend-series": { flexDirection: "column" } },
        },
      }}
      sx={{
        ml: -1.5,
        '& .MuiAreaElement-root[data-series="connections"]': { fill: "url(#GradientConnections)" },
      }}
    >
      <linearGradient id="GradientConnections" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={theme.palette.info.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.info.main} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

export { ConnectionsChart };
