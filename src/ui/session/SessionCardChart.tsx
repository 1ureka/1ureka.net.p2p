import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useSession } from "@/transport-state/store";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const yAxis1: YAxis<"linear"> = { dataKey: "egress", valueFormatter: formatBytes };
const yAxis2: YAxis<"linear"> = { dataKey: "ingress", valueFormatter: formatBytes };

const series1: LineSeries = {
  id: "egress",
  dataKey: "egress",
  showMark: false,
  area: true,
  curve: "linear",
  color: theme.palette.primary.main,
  valueFormatter: formatBytes,
};
const series2: LineSeries = {
  id: "ingress",
  dataKey: "ingress",
  showMark: false,
  area: true,
  curve: "linear",
  color: theme.palette.secondary.main,
  valueFormatter: formatBytes,
};

const SessionCardChart = () => {
  const points = useSession((state) => state.traffic);
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

  return (
    <LineChart
      dataset={points}
      xAxis={[xAxis]}
      yAxis={[yAxis1, yAxis2]}
      series={[series1, series2]}
      grid={{ vertical: true, horizontal: true }}
      sx={{
        ml: -1.5,
        '& .MuiAreaElement-root[data-series="egress"]': { fill: "url(#GradientEgress)" },
        '& .MuiAreaElement-root[data-series="ingress"]': { fill: "url(#GradientIngress)" },
      }}
    >
      <linearGradient id="GradientEgress" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
      </linearGradient>
      <linearGradient id="GradientIngress" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={theme.palette.secondary.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

export { SessionCardChart };
