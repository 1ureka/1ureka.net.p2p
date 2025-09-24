import { AnimatePresence, motion } from "motion/react";
import { Box, Typography } from "@mui/material";
import { ellipsisSx } from "@/components-lib/Property";

import { useBridge } from "@/store/bridge";
import { useWebRTC } from "@/store/webrtc";
import type { ConnectionLogEntry } from "@/store/type";

const formatData = (data: Record<string, unknown>) => {
  try {
    // 檢查是否是 Error 物件
    if (data.error && typeof data.error === "object") {
      const error = data.error as any;
      if (error.message) {
        return `錯誤: ${error.message}`;
      }
      if (error.code) {
        return `錯誤代碼: ${error.code}`;
      }
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

const getRow = ({ level, timestamp, message, module, data }: ConnectionLogEntry) => {
  const dataString = data ? formatData(data) : null;

  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="body2" sx={{ color: getColor(level) }}>
        {`[${new Date(timestamp).toLocaleTimeString()}] [${module}] ${message}`}
      </Typography>
      {dataString && (
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", ml: 1, fontFamily: "monospace", ...ellipsisSx, WebkitLineClamp: 2 }}
        >
          {dataString}
        </Typography>
      )}
    </Box>
  );
};

const ConnectionLogs = () => {
  const history1 = useBridge((state) => state.history);
  const history2 = useWebRTC((state) => state.history);
  const history = [...history1, ...history2].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        bgcolor: "background.paper",
        borderRadius: 2,
        p: 1.5,
      }}
    >
      {history.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          連接日誌將顯示在此處
        </Typography>
      )}
      <AnimatePresence>
        {history.map((item, index) => (
          <motion.div
            key={item.timestamp + item.message + index}
            layout
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {getRow(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export { ConnectionLogs };
