import { Box, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { useLogs } from "@/ui/events/EventsList";
import type { ConnectionLogLevel } from "@/utils";

const chipTypes = ["info", "warn", "error", "total"] as const;

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

const chipDisplayOnSmall: Record<ConnectionLogLevel | "total", boolean> = {
  info: false,
  warn: true,
  error: true,
  total: false,
};

const EventsSummary = () => {
  const logs = useLogs();

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

  const chips = chipTypes.map((level) => ({
    level,
    color: counts[level] > 0 ? chipColors[level] : "text.secondary",
    text: `${counts[level]} ${level}`,
  }));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
      {chips.map(({ level, color, text }) => (
        <Box key={level} sx={{ display: { xs: chipDisplayOnSmall[level] ? "block" : "none", lg: "block" } }}>
          <StatChip color={color} text={text} />
        </Box>
      ))}
    </Box>
  );
};

export { EventsSummary };
