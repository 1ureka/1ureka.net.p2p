import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/transport/store";
import { useTab } from "@/ui/tabs";

import { Header } from "@/ui/components/Header";
import { EventsCard } from "@/ui/components/EventsCard";
import { SessionCard } from "@/ui/components/SessionCard";
import { TrafficCard } from "@/ui/components/TrafficCard";
import { MappingCard, RuleCard } from "@/ui/components/RouteCard";
import { CreateSessionCard, JoinSessionCard } from "@/ui/components/LaunchCard";

const OverviewPage = ({ type }: { type: "rule" | "mapping" }) => {
  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 2, px: 4, py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SessionCard />
          {type === "rule" ? <RuleCard /> : <MappingCard />}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TrafficCard />
          <EventsCard />
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
    </>
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
  sx: { flex: 1, display: "flex", flexDirection: "column" },
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
        <Box key="overview-null" {...PageWrapperProps}>
          <LaunchPage />
        </Box>
      )}
      {tab === "overview" && overviewType === "host" && (
        <Box key="overview-host" {...PageWrapperProps}>
          <OverviewPage type="rule" />
        </Box>
      )}
      {tab === "overview" && overviewType === "client" && (
        <Box key="overview-client" {...PageWrapperProps}>
          <OverviewPage type="mapping" />
        </Box>
      )}
    </AnimatePresence>
  );
};

const FooterAccent = () => {
  return <Box sx={{ borderTop: "1px solid", borderColor: "divider", py: 2.5, bgcolor: "background.paper" }} />;
};

const App = () => {
  return (
    <Box
      sx={{ height: "100dvh", overflow: "auto" }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Box sx={{ minWidth: "fit-content", minHeight: 1, display: "flex", flexDirection: "column" }}>
        <Header />
        <Pages />
        <FooterAccent />
      </Box>
    </Box>
  );
};

export { App };
