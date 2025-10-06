import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography, type BoxProps } from "@mui/material";
import { format } from "pretty-format";

import { useAdapter } from "@/adapter/store";
import { useSession } from "@/transport/store";
import { mergeRepeatedLogs, type ConnectionLogEntry, type ConnectionLogLevel } from "@/utils";
import { ellipsisSx } from "@/ui/theme";

const formatLevel = (level: ConnectionLogLevel) => {
  if (level === "info") return "\u00A0INFO";
  if (level === "warn") return "\u00A0WARN";
  if (level === "error") return "ERROR";
  return "\u00A0UNKN";
};

const colorMap: Record<
  ConnectionLogLevel,
  { background: string; text: { prefix: string; context: string; hover: string } }
> = {
  info: {
    background: "background.default",
    text: { prefix: "text.secondary", context: "text.primary", hover: "text.primary" },
  },
  warn: {
    background: "warning.main",
    text: { prefix: "warning.main", context: "warning.main", hover: "warning.main" },
  },
  error: {
    background: "error.main",
    text: { prefix: "error.main", context: "error.main", hover: "error.main" },
  },
};

const useLogs = () => {
  const adapterLogs = useAdapter((state) => state.history);
  const sessionLogs = useSession((state) => state.history);
  const logs = [...adapterLogs, ...sessionLogs].toSorted((a, b) => a.timestamp - b.timestamp);
  return mergeRepeatedLogs(logs);
};

const EventEntry = ({ log }: { log: ConnectionLogEntry }) => {
  const { level, module, message, data, timestamp } = log;
  const bgcolor = colorMap[level].background;

  const prefixSx: BoxProps["sx"] = {
    fontFamily: "Ubuntu",
    "div:hover > div > &": { color: colorMap[level].text.hover },
    color: colorMap[level].text.prefix,
    textWrap: "nowrap",
  };
  const textSx: BoxProps["sx"] = {
    fontFamily: "Ubuntu",
    "div:hover > div > &": { color: colorMap[level].text.hover },
    color: colorMap[level].text.context,
    ...ellipsisSx,
  };
  const dataSx: BoxProps["sx"] = {
    fontFamily: "Ubuntu",
    color: "text.secondary",
    ...ellipsisSx,
    WebkitLineClamp: 5,
  };

  return (
    <Box sx={{ position: "relative", "&:hover": { filter: "brightness(1.25)" }, py: 0.5, px: 1.5 }}>
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", bgcolor, opacity: 0.25 }} />

      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <Typography variant="body2" sx={prefixSx}>
          [{new Date(timestamp).toLocaleTimeString("en-US") + "\u00A0" + formatLevel(level)}]:
        </Typography>
        <Typography variant="body2" sx={prefixSx}>
          [{module.toUpperCase()}]
        </Typography>
        <Typography variant="body2" sx={textSx}>
          {message}
        </Typography>
      </Box>

      {data && (
        <Typography variant="caption" sx={{ ml: 1, ...dataSx }}>
          {format(data)}
        </Typography>
      )}
    </Box>
  );
};

const NoItemDisplay = ({ hasFilters }: { hasFilters: boolean }) => {
  const title = hasFilters ? "No matching events" : "No events yet";
  const description = hasFilters
    ? "No events match your current filters. Try adjusting your filter settings."
    : "There are no connection events to display. Logs will appear here once the system starts running.";

  return (
    <Box sx={{ display: "grid", placeItems: "center", height: 1 }}>
      <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>
        <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

        <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export { EventEntry, useLogs, NoItemDisplay };
