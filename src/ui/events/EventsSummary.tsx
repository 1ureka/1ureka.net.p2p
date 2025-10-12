import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";

import { Box, Divider, type IconProps, type SxProps, Typography } from "@mui/material";
import { GithubTooltip } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import { useLogs } from "@/ui/events/EventsList";
import type { ConnectionLogLevel } from "@/utils";

const chipTypes: readonly (ConnectionLogLevel | "total")[] = ["info", "warn", "error", "total"] as const;

const chipColors: Record<(typeof chipTypes)[number], string> = {
  info: "text.secondary",
  warn: "warning.main",
  error: "error.main",
  total: "text.secondary",
};

const chipIcons: Record<(typeof chipTypes)[number], React.ComponentType<IconProps>> = {
  info: InfoRoundedIcon,
  warn: WarningRoundedIcon,
  error: ErrorRoundedIcon,
  total: SummarizeRoundedIcon,
};

const StatChip = ({ level, value, sx }: { level: (typeof chipTypes)[number]; value: number; sx?: SxProps }) => {
  const color = chipColors[level];
  const Icon = chipIcons[level];

  return (
    <GithubTooltip title={level.charAt(0).toUpperCase() + level.slice(1) + " events count"}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "help",
          "&:hover": { bgcolor: "action.hover" },
          ...sx,
        }}
      >
        <Icon fontSize="small" sx={{ color }} />
        <Typography variant="body2" sx={{ color, ...centerTextSx }}>
          {value}
        </Typography>
      </Box>
    </GithubTooltip>
  );
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

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        color: "text.secondary",
        borderRadius: 1,
        outline: "2px solid",
        outlineColor: "divider",
        overflow: "hidden",
      }}
    >
      {chipTypes.map((level, i) => (
        <>
          <StatChip
            level={level}
            value={counts[level]}
            sx={{ pl: i === 0 ? 0.5 : 1, pr: i === chipTypes.length - 1 ? 0.5 : 1, py: 0.5 }}
          />
          {i < chipTypes.length - 1 && <Divider orientation="vertical" flexItem />}
        </>
      ))}
    </Box>
  );
};

export { EventsSummary };
