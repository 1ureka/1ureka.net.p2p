import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useSession } from "@/transport-state/store";
import { formatBytes } from "@/utils";

const uuid = crypto.randomUUID();

const TrafficChart = ({ direction }: { direction: "egress" | "ingress" }) => {
  const points = useSession((state) => state.traffic);
  const color = direction === "egress" ? theme.palette.primary.main : theme.palette.success.main;
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

  const yAxis: YAxis<"symlog"> = {
    dataKey: direction,
    scaleType: "symlog",
    width: 48,
    min: 0,
    max: 100 * 1024 * 1024,
    tickInterval: [10, 1 * 1024, 1 * 1024 * 1024, 100 * 1024 * 1024],
    valueFormatter: formatBytes,
  };

  const series: LineSeries = {
    dataKey: direction,
    showMark: false,
    area: true,
    curve: "linear",
    color,
    valueFormatter: formatBytes,
  };

  return (
    <LineChart
      dataset={points}
      xAxis={[xAxis]}
      yAxis={[yAxis]}
      series={[series]}
      grid={{ vertical: true, horizontal: true }}
      sx={{ "& .MuiAreaElement-root": { fill: `url(#Gradient-${uuid}-${direction})` }, mb: -2 }}
    >
      <linearGradient id={`Gradient-${uuid}-${direction}`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

export { TrafficChart };
