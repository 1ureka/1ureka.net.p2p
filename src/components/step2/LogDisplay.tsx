import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import type { BridgeLogEntry } from "@/store/bridge";

const getRow = ({ level, timestamp, message, module, data }: BridgeLogEntry) => {
  const getColor = () => {
    switch (level) {
      case "error":
        return "error.main";
      case "warn":
        return "warning.main";
      default:
        return "text.secondary";
    }
  };

  // 改變成多行，適合顯示 BridgeLogEntry，記得一路去找到究竟 data 是什麼樣的東西，該如何呈現給使用者
  return (
    <Typography variant="body2" sx={{ mb: 0.5, color: getColor() }}>
      {`[${new Date(timestamp).toLocaleTimeString()}] [${module}] ${message}`}
    </Typography>
  );
};

const LogDisplay = ({ history }: { history: BridgeLogEntry[] }) => {
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
        border: 1,
        borderColor: "divider",
      }}
    >
      {history.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", userSelect: "none" }}
        >
          TCP 連接日誌將顯示在此處
        </Typography>
      )}
      <AnimatePresence>
        {history.slice(-7).map((item, index) => (
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

export { LogDisplay };
