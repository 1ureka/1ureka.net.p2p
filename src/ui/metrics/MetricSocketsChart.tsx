import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { useState, useEffect } from "react";

type SocketsPoint = {
  timestamp: number;
  count: number;
};

const HISTORY_DURATION = 60000; // 60 秒

const useSocketsHistory = () => {
  const sockets = useAdapter((state) => state.sockets);
  const [history, setHistory] = useState<SocketsPoint[]>([]);

  useEffect(() => {
    const now = Date.now();
    const newPoint = { timestamp: now, count: sockets.length };

    setHistory((prev) => {
      const cutoff = now - HISTORY_DURATION;

      // 找出所有在範圍內的資料點
      const withinRange = prev.filter((p) => p.timestamp >= cutoff);

      // 找出最接近 cutoff 但在範圍外的資料點（作為起始點）
      const beforeRange = prev.filter((p) => p.timestamp < cutoff);
      const anchorPoint = beforeRange.length > 0 ? beforeRange[beforeRange.length - 1] : null;

      // 如果有錨點，將它加入作為起始點
      if (anchorPoint && withinRange.length > 0) {
        return [anchorPoint, ...withinRange, newPoint];
      }

      return [...withinRange, newPoint];
    });
  }, [sockets.length]);

  return history;
};

const uuid = crypto.randomUUID();

const SocketsChart = () => {
  const points = useSocketsHistory();
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
