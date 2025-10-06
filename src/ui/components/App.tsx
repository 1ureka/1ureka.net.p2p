import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/transport/store";
import { useTab } from "@/ui/tabs";
import { centerTextSx } from "@/ui/theme";

import { Header } from "@/ui/components/Header";
import { EventsCard } from "@/ui/components/EventsCard";
import { EventsPage } from "@/ui/components/EventsPage";
import { SessionCard } from "@/ui/components/SessionCard";
import { TrafficCard } from "@/ui/components/TrafficCard";
import { MappingCard, RuleCard } from "@/ui/components/RouteCard";
import { CreateSessionCard, JoinSessionCard } from "@/ui/components/LaunchCard";

const OverviewPage = ({ type }: { type: "rule" | "mapping" }) => {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 2, px: 4, py: 3, minHeight: 0, flex: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
        <SessionCard />
        {type === "rule" ? <RuleCard /> : <MappingCard />}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
        <TrafficCard />
        <EventsCard />
      </Box>
    </Box>
  );
};

const LaunchPage = () => {
  return (
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
  );
};

const PageWrapperProps = {
  sx: { flex: 1, minHeight: 0, overflow: "auto" },
  component: motion.div,
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
} as const;

const Pages = () => {
  const status = useSession((state) => state.status);
  const role = useSession((state) => state.role);
  const tab = useTab((state) => state.tab);

  const overviewType = ["disconnected", "joining"].includes(status) ? null : role;

  return (
    <AnimatePresence mode="wait">
      {tab === "overview" && overviewType === null && (
        <Stack key="overview-null" {...PageWrapperProps}>
          <LaunchPage />
        </Stack>
      )}
      {tab === "overview" && overviewType === "host" && (
        <Stack key="overview-host" {...PageWrapperProps}>
          <OverviewPage type="rule" />
        </Stack>
      )}
      {tab === "overview" && overviewType === "client" && (
        <Stack key="overview-client" {...PageWrapperProps}>
          <OverviewPage type="mapping" />
        </Stack>
      )}
      {tab === "events" && (
        <Stack key="events" {...PageWrapperProps}>
          <EventsPage />
        </Stack>
      )}
    </AnimatePresence>
  );
};

const Footer = () => {
  return (
    <Box sx={{ borderTop: "2px solid", borderColor: "divider", p: 2, bgcolor: "background.paper" }}>
      {/* 左側新增 link 樣式的按紐，可以開啟F12 */}
      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "right", ...centerTextSx }}>
        v1.0.0-alpha.5
      </Typography>
    </Box>
  );
};

const App = () => {
  return (
    <Stack sx={{ height: "100dvh" }}>
      <Header />
      <Pages />
      <Footer />
    </Stack>
  );
};

export { App };
