import { AnimatePresence, motion } from "motion/react";
import { Box, Typography } from "@mui/material";
import { LayoutBox } from "@/ui/components/Layout";
import { ellipsisSx } from "@/ui/components/Property";

import { useAdapter } from "@/adapter/store";
import { useTransport } from "@/transport/store";
import type { ConnectionLogEntry } from "@/utils";

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

const getColor = (level: ConnectionLogEntry["level"]) => {
  switch (level) {
    case "error":
      return "error.main";
    case "warn":
      return "warning.main";
    default:
      return "text.secondary";
  }
};

const getRow = (params: ConnectionLogEntry & { current: boolean }) => {
  const { level, timestamp, current, module, data } = params;
  const dataString = data ? formatData(data) : null;
  const message =
    (current ? ">> " : "   ") +
    `[${new Date(timestamp).toLocaleTimeString()}] [${module.toUpperCase()}] ${params.message}`;

  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="body2" sx={{ color: getColor(level), fontFamily: "Ubuntu", ...ellipsisSx }}>
        {message}
      </Typography>
      {dataString && (
        <Typography
          variant="caption"
          sx={{ fontFamily: "Ubuntu", color: "text.disabled", ml: 1, ...ellipsisSx, WebkitLineClamp: 2 }}
        >
          {dataString}
        </Typography>
      )}
    </Box>
  );
};

const ConnectionLogs = () => {
  const history1 = useAdapter((state) => state.history);
  const history2 = useTransport((state) => state.history);
  const history = [...history1, ...history2].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column-reverse",
        justifyContent: "flex-end",
        borderRadius: 2,
        p: 1.5,
        height: 1,
        fontFamily: "Ubuntu",
      }}
    >
      {history.length === 0 && (
        <LayoutBox sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Typography variant="body2" sx={{ fontFamily: "Ubuntu", textAlign: "center", color: "text.secondary" }}>
            errors and logs will be displayed here during the connection process.
          </Typography>
        </LayoutBox>
      )}
      <AnimatePresence>
        {history.map((item, index) => (
          <motion.div
            key={item.timestamp + item.message + index}
            layout
            initial={{ opacity: 0, scale: 0.95, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {getRow({ ...item, current: index === history.length - 1 })}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export { ConnectionLogs };
