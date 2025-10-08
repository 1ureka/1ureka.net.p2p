import { Box, Stack } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/transport-state/store";
import { useTab } from "@/ui/tabs";
import { memo } from "react";

import { Header } from "@/ui/components/Header";
import { Footer } from "@/ui/components/Footer";

import { LaunchPage } from "@/ui/launch/LaunchPage";
import { SessionCard } from "@/ui/session/SessionCard";
import { RouteCard } from "@/ui/components/RouteCard";
import { EventsCard } from "@/ui/events/EventsCard";
import { EventsPage } from "@/ui/events/EventsPage";
import { MetricPage } from "@/ui/metrics/MetricPage";

const OverviewPage = memo(() => (
  <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 2, px: 4, py: 3, minHeight: 650, flex: 1 }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <SessionCard />
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <RouteCard />
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
  const tab = useTab((state) => state.tab);
  const overviewType = ["disconnected", "joining"].includes(status) ? null : "session";

  return (
    <AnimatePresence mode="wait">
      {tab === "overview" && overviewType === null && (
        <Stack key="overview-null" {...PageWrapperProps}>
          <LaunchPage />
        </Stack>
      )}
      {tab === "overview" && overviewType !== null && (
        <Stack key="overview-session" {...PageWrapperProps}>
          <OverviewPage />
        </Stack>
      )}
      {tab === "events" && (
        <Stack key="events" {...PageWrapperProps}>
          <EventsPage />
        </Stack>
      )}
      {tab === "metrics" && (
        <Stack key="metrics" {...PageWrapperProps}>
          <MetricPage />
        </Stack>
      )}
    </AnimatePresence>
  );
};

const App = () => (
  <Stack sx={{ height: "100dvh" }}>
    <Header />
    <Pages />
    <Footer />
  </Stack>
);

export { App };
