// TODO: Drawer, TCP Bridge / WebRTC tabs, log list

import { Box, Chip, Drawer, Typography, type DrawerProps } from "@mui/material";
import { useState } from "react";
import { buttonContainedSx } from "./utils";
// import { BridgeLogList } from "./BridgeLogList";

const LogDrawer = ({ open, onClose }: DrawerProps) => {
  const [tab, setTab] = useState<"webrtc" | "bridge">("webrtc");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        paper: {
          elevation: 3,
          sx: {
            p: 3,
            width: 450,
            borderRadius: ({ shape: { borderRadius } }) =>
              `${(borderRadius as number) * 5}px 0 0 ${(borderRadius as number) * 5}px`,
          },
        },
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">日誌紀錄</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          包含 WebRTC 及橋接服務的運行日誌。
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Chip
          label="WebRTC"
          color={tab === "webrtc" ? "primary" : "default"}
          onClick={() => setTab("webrtc")}
          sx={{
            ...buttonContainedSx,
            "&:hover": { scale: "1.05", bgcolor: tab === "webrtc" ? "primary.light" : undefined },
          }}
        />
        <Chip
          label="橋接服務"
          color={tab === "bridge" ? "primary" : "default"}
          onClick={() => setTab("bridge")}
          sx={{
            ...buttonContainedSx,
            "&:hover": { scale: "1.05", bgcolor: tab === "bridge" ? "primary.light" : undefined },
          }}
        />
      </Box>

      {/* 日誌內容區域 */}
      <Box sx={{ mt: 3, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "webrtc" && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              WebRTC 日誌功能開發中...
            </Typography>
          </Box>
        )}

        {/* {tab === "bridge" && <BridgeLogList />} */}
      </Box>
    </Drawer>
  );
};

export { LogDrawer };
