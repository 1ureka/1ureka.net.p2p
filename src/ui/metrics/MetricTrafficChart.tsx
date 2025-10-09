import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useSession } from "@/transport-state/store";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  const yAxis: YAxis<"linear"> = {
    dataKey: direction,
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
