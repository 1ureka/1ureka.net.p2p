import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import type { WebRTCLogEntry } from "@/store/webrtc";

const getRow = ({ level, timestamp, message }: WebRTCLogEntry) => {
  return (
    <Typography variant="body2" sx={{ mb: 0.5, color: level === "error" ? "error.main" : "text.secondary" }}>
      {`[${new Date(timestamp).toLocaleTimeString()}] ${message}`}
    </Typography>
  );
};

const LogDisplay = ({ history }: { history: WebRTCLogEntry[] }) => {
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
          連接日誌將顯示在此處
        </Typography>
      )}
      <AnimatePresence>
        {history.slice(-7).map((item) => (
          <motion.div
            key={item.timestamp + item.message}
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
