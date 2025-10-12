import { Box, Stack } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/transport-state/store";
import { memo } from "react";

import { Header } from "@/ui/components/Header";
import { LaunchPage } from "@/ui/launch/LaunchPage";
import { SessionCard } from "@/ui/session/SessionCard";
import { ConfigsCard } from "@/ui/configs/ConfigsCard";
import { EventsCard } from "@/ui/events/EventsCard";

const OverviewPage = memo(() => (
  <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 2, px: 4, py: 3, minHeight: 650, flex: 1 }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <SessionCard />
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <ConfigsCard />
      <EventsCard />
    </Box>
  </Box>
));

OverviewPage.displayName = "OverviewPage";

const PageWrapperProps = {
  sx: { flex: 1, minHeight: 0, overflow: "auto" },
  component: motion.div,
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
} as const;

const Pages = () => {
  const status = useSession((state) => state.status);
  const sessionActive = !["disconnected", "joining"].includes(status);

  return (
    <AnimatePresence mode="wait">
      {!sessionActive && (
        <Stack key="overview-null" {...PageWrapperProps}>
          <LaunchPage />
        </Stack>
      )}
      {sessionActive && (
        <Stack key="overview-session" {...PageWrapperProps}>
          <OverviewPage />
        </Stack>
      )}
    </AnimatePresence>
  );
};

const App = () => (
  <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
    <Header />
    <Pages />
  </Stack>
);

export { App };
