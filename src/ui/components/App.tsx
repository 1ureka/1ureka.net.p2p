import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";

import { Header } from "@/ui/components/Header";
import { EventsCard } from "@/ui/components/EventsCard";
import { SessionCard } from "@/ui/components/SessionCard";
import { MappingCard } from "@/ui/components/MappingCard";
import { TrafficCard } from "@/ui/components/TrafficCard";
import { CreateSessionCard, JoinSessionCard } from "@/ui/components/LaunchCard";
import { useTabs } from "@/ui/tabs";

const ClientPage = () => {
  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", gap: 2, px: 4, py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SessionCard />
          <MappingCard />
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
  const page = useTabs((state) => state.page);

  return (
    <AnimatePresence mode="wait">
      {page === "launch" && (
        <Box key="launch" {...PageWrapperProps}>
          <LaunchPage />
        </Box>
      )}
      {page === "overview" && (
        <Box key="overview" {...PageWrapperProps}>
          <ClientPage />
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
