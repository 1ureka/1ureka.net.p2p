import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { create } from "zustand";

type SocketsPoint = {
  timestamp: number;
  count: number;
};

const useSocketPoints = create<{ points: SocketsPoint[] }>((set) => {
  const MAX_AGE_MS = 60000;
  const INTERVAL_MS = 1000;
  const INTERVAL_FILTER_MS = 60000;
  let counts = 0;
  let lastFilter = Date.now();

  useAdapter.subscribe((curr, prev) => {
    if (curr.sockets !== prev.sockets) {
      counts = curr.sockets.length;
    }
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

const getDataMax = (points: SocketsPoint[]) => {
  const candidates = [10, 25, 50, 100, 500, 1000];
  if (points.length === 0) return candidates[0];
  const dataMax = Math.max(...points.map((p) => p.count));
  const target = Math.max(1, dataMax);
  return candidates.find((c) => c >= target) ?? candidates[candidates.length - 1];
};

const uuid = crypto.randomUUID();

const SocketsChart = () => {
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
    max: getDataMax(points),
  };

  const series: LineSeries = {
    dataKey: "count",
    showMark: false,
    area: true,
    curve: "linear",
    color,
  };

  return (
    <LineChart
      dataset={points}
      xAxis={[xAxis]}
      yAxis={[yAxis]}
      series={[series]}
      grid={{ vertical: true, horizontal: true }}
      sx={{ "& .MuiAreaElement-root": { fill: `url(#Gradient-${uuid}-sockets)` }, mb: -2 }}
    >
      <linearGradient id={`Gradient-${uuid}-sockets`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

export { SocketsChart };
