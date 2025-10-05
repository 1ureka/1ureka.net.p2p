import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography, type BoxProps } from "@mui/material";
import { format } from "pretty-format";

import { useTab } from "@/ui/tabs";
import { useAdapter } from "@/adapter/store";
import { useSession } from "@/transport/store";
import type { ConnectionLogEntry, ConnectionLogLevel } from "@/utils";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

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
  return logs;
};

const Chip = ({ color, text }: { color: string; text: string }) => {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: color, opacity: 0.2 }} />
      <Typography variant="body2" sx={{ position: "relative", textWrap: "nowrap", color, ...centerTextSx }}>
        {text}
      </Typography>
    </Box>
  );
};

const EventsSummary = () => {
  const setTab = useTab((state) => state.setTab);
  const logs = useLogs();
  const warningCount = logs.filter((log) => log.level === "warn").length;
  const errorCount = logs.filter((log) => log.level === "error").length;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
      <GithubButton
        sx={{ py: 0.5, px: 1, bgcolor: "background.default" }}
        startIcon={<ListAltRoundedIcon fontSize="small" />}
        onClick={() => setTab("events")}
      >
        <Typography variant="button" sx={{ textTransform: "none", textWrap: "nowrap", ...centerTextSx }}>
          view all logs
        </Typography>
      </GithubButton>

      <Chip color={warningCount > 0 ? "warning.main" : "text.secondary"} text={`${warningCount} warnings`} />
      <Chip color={errorCount > 0 ? "error.main" : "text.secondary"} text={`${errorCount} errors`} />
    </Box>
  );
};

const EventsLog = ({ log }: { log: ConnectionLogEntry }) => {
  const bgcolor = getBgColor(log.level);
  const colors = getColor(log.level);
  const baseSx: BoxProps["sx"] = { fontFamily: "Ubuntu", "div:hover > div > &": { color: colors.hover } };

  const prefixSx: BoxProps["sx"] = { ...baseSx, color: colors.prefix, textWrap: "nowrap" };
  const textSx: BoxProps["sx"] = { ...baseSx, color: colors.context, ...ellipsisSx };
  const dataSx: BoxProps["sx"] = { ...baseSx, color: "text.secondary", ...ellipsisSx, WebkitLineClamp: 5 };

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

const NoItemDisplay = () => {
  const title = "No events yet";
  const description =
    "There are no connection events to display. Logs will appear here once the system starts running.";
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

const EventsLogs = () => {
  const logs = useLogs();

  return (
    <Box sx={{ height: 350, overflow: "auto" }}>
      {logs.length <= 0 && <NoItemDisplay />}
      {logs.map((log) => (
        <EventsLog key={log.id} log={log} />
      ))}
    </Box>
  );
};

const EventsCard = () => {
  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Events
        </Typography>
        <Box sx={{ flex: 1 }} />
        <EventsSummary />
      </CardHeader>

      <EventsLogs />

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { EventsCard };
