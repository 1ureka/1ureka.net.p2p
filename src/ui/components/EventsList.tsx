import { Box, Typography, type BoxProps } from "@mui/material";
import { format } from "pretty-format";

import { useAdapter } from "@/adapter/store";
import { useSession } from "@/transport/store";
import { mergeRepeatedLogs, type ConnectionLogEntry, type ConnectionLogLevel } from "@/utils";
import { centerTextSx, ellipsisSx } from "@/ui/theme";

const formatLevel = (level: ConnectionLogLevel) => {
  if (level === "info") return "\u00A0INFO";
  if (level === "warn") return "\u00A0WARN";
  if (level === "error") return "ERROR";
  return "\u00A0UNKN";
};

const getBgColor = (level: ConnectionLogLevel) => {
  if (level === "info") return "background.default";
  if (level === "warn") return "warning.main";
  if (level === "error") return "error.main";
  return "background.default";
};

const getColor = (level: ConnectionLogLevel): { prefix: string; context: string; hover: string } => {
  if (level === "warn") return { prefix: "warning.main", context: "warning.main", hover: "warning.main" };
  if (level === "error") return { prefix: "error.main", context: "error.main", hover: "error.main" };
  return { prefix: "text.secondary", context: "text.primary", hover: "text.primary" };
};

const useLogs = () => {
  const adapterLogs = useAdapter((state) => state.history);
  const sessionLogs = useSession((state) => state.history);
  const logs = [...adapterLogs, ...sessionLogs].toSorted((a, b) => a.timestamp - b.timestamp);
  return mergeRepeatedLogs(logs);
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

const EventEntry = ({ log }: { log: ConnectionLogEntry }) => {
  const bgcolor = getBgColor(log.level);
  const colors = getColor(log.level);
  const baseSx: BoxProps["sx"] = { fontFamily: "Ubuntu", "div:hover > div > &": { color: colors.hover } };

  const prefixSx: BoxProps["sx"] = { ...baseSx, color: colors.prefix, textWrap: "nowrap" };
  const textSx: BoxProps["sx"] = { ...baseSx, color: colors.context, ...ellipsisSx };
  const dataSx: BoxProps["sx"] = { fontFamily: "Ubuntu", color: "text.secondary", ...ellipsisSx, WebkitLineClamp: 5 };

  return (
    <Box sx={{ position: "relative", "&:hover": { filter: "brightness(1.25)" }, py: 0.5, px: 1.5 }}>
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", bgcolor, opacity: 0.25 }} />

      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <Typography variant="body2" sx={prefixSx}>
          [{new Date(log.timestamp).toLocaleTimeString("en-US") + "\u00A0" + formatLevel(log.level)}]:
        </Typography>
        <Typography variant="body2" sx={prefixSx}>
          [{log.module.toUpperCase()}]
        </Typography>
        <Typography variant="body2" sx={textSx}>
          {log.message}
        </Typography>
      </Box>

      {log.data && (
        <Typography variant="caption" sx={{ ml: 1, ...dataSx }}>
          {format(log.data)}
        </Typography>
      )}
    </Box>
  );
};

export { EventEntry, useLogs };
