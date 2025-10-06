import { Box, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import type { ConnectionLogEntry, ConnectionLogLevel } from "@/utils";

const chipColors: Record<ConnectionLogLevel | "total", string> = {
  info: "text.secondary",
  warn: "warning.main",
  error: "error.main",
  total: "text.secondary",
};

const StatChip = ({ color, text }: { color: string; text: string }) => {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: color, opacity: 0.2 }} />
      <Typography variant="body2" sx={{ position: "relative", textWrap: "nowrap", color, ...centerTextSx }}>
        {text}
      </Typography>
    </Box>
  );
};

type EventsSummaryProps = {
  logs: ConnectionLogEntry[];
  display: Record<ConnectionLogLevel | "total", boolean>;
};

const EventsSummary = ({ logs, display }: EventsSummaryProps) => {
  const counts = logs.reduce(
    (acc, log) => {
      acc.total += 1;
      if (log.level === "info") acc.info += 1;
      if (log.level === "warn") acc.warn += 1;
      if (log.level === "error") acc.error += 1;
      return acc;
    },
    { total: 0, info: 0, warn: 0, error: 0 }
  );

  const array = Object.entries(display).filter(([, v]) => v) as [ConnectionLogLevel | "total", true][];
  const chips = array.map(([level]) => ({
    color: counts[level] > 0 ? chipColors[level] : "text.secondary",
    text: `${counts[level]} ${level}`,
  }));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
      {chips.map(({ color, text }) => (
        <StatChip key={text} color={color} text={text} />
      ))}
    </Box>
  );
};

export { EventsSummary };
