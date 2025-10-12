import type { XAxis, YAxis } from "@mui/x-charts/models";
import { LineChart, type LineSeries } from "@mui/x-charts/LineChart";
import { theme } from "@/ui/theme";
import { useSession } from "@/transport-state/store";
import { formatBytes } from "@/utils";

const yAxis1: YAxis<"symlog"> = {
  dataKey: "egress",
  scaleType: "symlog",
  width: 48,
  min: 0,
  max: 100 * 1024 * 1024,
  tickInterval: [10, 1 * 1024, 1 * 1024 * 1024, 100 * 1024 * 1024],
  valueFormatter: formatBytes,
};
const yAxis2: YAxis<"symlog"> = {
  dataKey: "ingress",
  scaleType: "symlog",
  width: 48,
  min: 0,
  max: 100 * 1024 * 1024,
  tickInterval: [10, 1 * 1024, 1 * 1024 * 1024, 100 * 1024 * 1024],
  valueFormatter: formatBytes,
};

const series1: LineSeries = {
  id: "egress",
  label: "Egress",
  dataKey: "egress",
  showMark: false,
  area: true,
  curve: "linear",
  color: theme.palette.primary.main,
  valueFormatter: formatBytes,
  labelMarkType: "square",
};
const series2: LineSeries = {
  id: "ingress",
  label: "Ingress",
  dataKey: "ingress",
  showMark: false,
  area: true,
  curve: "linear",
  color: theme.palette.success.main,
  valueFormatter: formatBytes,
  labelMarkType: "square",
};

const TrafficChart = () => {
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
      slotProps={{
        legend: {
          direction: "vertical",
          sx: { gap: 3.5, ml: 0, ".MuiChartsLegend-series": { flexDirection: "column" } },
        },
      }}
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
        <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
        <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0} />
      </linearGradient>
    </LineChart>
  );
};

export { TrafficChart };
