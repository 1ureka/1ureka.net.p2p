import LanRoundedIcon from "@mui/icons-material/LanRounded";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";

import { Background } from "@/ui/components/Background";
import { LayoutColumn, LayoutRow } from "@/ui/components/Layout";
import { ClientPanel, HostPanel, LogPanel, SessionPanel, SocketPanel, TrafficPanel } from "@/ui/components/Panels";
import { useSession } from "@/transport/store";

const Title = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, p: 1.5 }}>
    <Box sx={{ bgcolor: "primary.main", p: 1, borderRadius: 1 }}>
      <LanRoundedIcon fontSize="large" sx={{ display: "block", color: "text.primary" }} />
    </Box>

    <Typography variant="h6" component="h1">
      1ureka.net.p2p
    </Typography>
  </Box>
);

const LeftPanels = () => {
  const sessionId = useSession((state) => state.session.id);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {!sessionId ? (
        <motion.div
          key={"host-panel"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <HostPanel />
        </motion.div>
      ) : null}
      {!sessionId ? (
        <motion.div
          key={"client-panel"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <ClientPanel />
        </motion.div>
      ) : null}
      {sessionId ? (
        <motion.div
          key={"session-panel"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <SessionPanel />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const rootSx = {
  width: "100dvw",
  height: "100dvh",
  p: 2.5,
  gridTemplateColumns: "400px minmax(400px, 1fr)",
};

const App = () => (
  <LayoutRow sx={rootSx}>
    <Background />
    <LayoutColumn>
      <Title />
      <LeftPanels />
    </LayoutColumn>
    <LayoutColumn sx={{ gridTemplateRows: "1fr 0.5fr", height: 1 }}>
      <LogPanel />
      <LayoutRow>
        <SocketPanel />
        <TrafficPanel />
      </LayoutRow>
    </LayoutColumn>

    <Typography variant="caption" sx={{ position: "absolute", bottom: 8, left: 8, color: "text.disabled" }}>
      v1.0.0-alpha.4
    </Typography>
  </LayoutRow>
);

export { App };
