import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography, type BoxProps } from "@mui/material";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import type { ConnectionLogEntry, ConnectionLogLevel } from "@/utils";

const modules = ["auth", "network", "websocket", "database", "api", "ui"];
const logMessages: Record<ConnectionLogLevel, string[]> = {
  info: [
    "Successfully established connection, <user>, <timestamp>, <sessionId>",
    "Heartbeat signal received.",
    "User authenticated.",
    "Cache refreshed, there are 42 items that need to be synced.",
    "Connection is stable.",
  ],
  warn: [
    "High latency detected.",
    "Retrying connection...",
    "Token is near expiration.",
    "Packet loss observed.",
    "Slow database response.",
  ],
  error: [
    "Connection failed: timeout.",
    "Authentication error.",
    "WebSocket disconnected unexpectedly.",
    "Database query failed.",
    "API request returned 500.",
  ],
};

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockLogs(count: number): ConnectionLogEntry[] {
  const now = Date.now();
  const logs: ConnectionLogEntry[] = [];
  const data = {
    retryCount: Math.floor(Math.random() * 5),
    errorMessage: "Sample error message",
    errorCode: "SAMPLE_CODE",
    status: "active",
  };

  for (let i = 0; i < count; i++) {
    const levels: ConnectionLogLevel[] = ["info", "info", "info", "info", "info", "warn", "error"];
    const level = getRandomItem<ConnectionLogLevel>(levels);
    const entry: ConnectionLogEntry = {
      id: crypto.randomUUID(),
      level,
      module: getRandomItem(modules),
      message: getRandomItem(logMessages[level]),
      timestamp: now - Math.floor(Math.random() * 1000 * 60 * 60), // 過去一小時內
      data: Math.random() > 0.6 ? data : undefined,
    };
    logs.push(entry);
  }

  return logs.sort((a, b) => a.timestamp - b.timestamp);
}

const EventsSummary = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
      <GithubButton
        sx={{ py: 0.5, px: 1, bgcolor: "background.default" }}
        startIcon={<ListAltRoundedIcon fontSize="small" />}
      >
        <Typography variant="button" sx={{ textTransform: "none", textWrap: "nowrap", ...centerTextSx }}>
          view all logs
        </Typography>
      </GithubButton>
      <Box sx={{ px: 1.5, py: 1, borderRadius: 99, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "error.main", opacity: 0.2 }} />
        <Typography
          variant="body2"
          color="error"
          sx={{ position: "relative", fontWeight: "bold", textWrap: "nowrap", ...centerTextSx }}
        >
          3 errors
        </Typography>
      </Box>
    </Box>
  );
};

const formatData = (data: Record<string, unknown>) => {
  try {
    // 檢查是否是 Error 物件
    if (data.error && typeof data.error === "object") {
      const error = data.error;
      if ("message" in error) return `Error: ${error.message}`;
      if ("code" in error) return `Error code: ${error.code}`;
    }

    // 對於其他類型的 data，嘗試格式化為可讀的字串
    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    return entries
      .map(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          return `${key}: ${value}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(", ");
  } catch {
    return JSON.stringify(data);
  }
};

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

type TextColor = {
  prefix: string;
  context: string;
  hover: string;
};

const getColor = (level: ConnectionLogLevel): TextColor => {
  if (level === "warn") return { prefix: "warning.main", context: "warning.main", hover: "warning.main" };
  if (level === "error") return { prefix: "error.main", context: "error.main", hover: "error.main" };
  return { prefix: "text.secondary", context: "text.primary", hover: "text.primary" };
};

const EventsLog = ({ log }: { log: ConnectionLogEntry }) => {
  const bgcolor = getBgColor(log.level);
  const colors = getColor(log.level);

  const prefixSx: BoxProps["sx"] = {
    fontFamily: "Ubuntu",
    color: colors.prefix,
    textWrap: "nowrap",
    "div:hover > div > &": { color: colors.hover },
  };

  const contextSx: BoxProps["sx"] = {
    fontFamily: "Ubuntu",
    color: colors.context,
    ...ellipsisSx,
    "div:hover > div > &": { color: colors.hover },
  };

  const dataString = log.data ? formatData(log.data) : null;

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

        <Typography variant="body2" sx={contextSx}>
          {log.message}
        </Typography>
      </Box>

      {dataString && (
        <Typography
          variant="caption"
          sx={{ fontFamily: "Ubuntu", color: "text.secondary", ml: 1, ...ellipsisSx, WebkitLineClamp: 2 }}
        >
          {dataString}
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
  const logs = generateMockLogs(0);

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
        <Box sx={{ flexGrow: 1 }} />
        <EventsSummary />
      </CardHeader>
      <EventsLogs />
      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { EventsCard };
