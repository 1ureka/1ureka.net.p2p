import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/transport-state/store";
import { useTab } from "@/ui/tabs";
import { memo } from "react";

import { Header } from "@/ui/components/Header";
import { Footer } from "@/ui/components/Footer";
import { CreateSessionCard, JoinSessionCard } from "@/ui/components/LaunchCard";

import { OverviewPage } from "@/ui/overview/OverviewPage";
import { EventsPage } from "@/ui/events/EventsPage";
import { MetricPage } from "@/ui/metrics/MetricPage";

const LaunchPage = memo(() => (
  <Box sx={{ display: "grid", placeItems: "center", gridTemplateRows: "1fr auto 1fr", flex: 1, gap: 5, py: 3 }}>
    <Box sx={{ textAlign: "center", alignSelf: "end" }}>
      <Typography variant="subtitle1" component="h1">
        Share TCP Services Over P2P
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 600 }}>
        Connect directly with others without port forwarding, fixed IPs, or proxy services. Choose your role to get
        started.
      </Typography>
    </Box>

    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start", width: 750, gap: 2 }}>
      <CreateSessionCard />
      <JoinSessionCard />
    </Box>

    <Box sx={{ textAlign: "center", alignSelf: "start" }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Not sure which option to choose?
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {"Check out the documentation for guidance: "}
        <Typography
          variant="body2"
          component="a"
          href="#"
          sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          usage guide
        </Typography>
      </Typography>
    </Box>
  </Box>
));

LaunchPage.displayName = "LaunchPage";

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
