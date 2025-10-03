import { Box } from "@mui/material";
import { motion } from "motion/react";

import { Header } from "@/ui/components/Header";
import { EventsCard } from "@/ui/components/EventsCard";
import { SessionCard } from "@/ui/components/SessionCard";
import { MappingCard } from "@/ui/components/MappingCard";
import { EgressCard, IngressCard } from "@/ui/components/TrafficCard";

const App = () => {
  return (
    <Box
      sx={{ height: "100dvh", overflow: "auto" }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Header />
      <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", alignItems: "start", gap: 2, px: 4, py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SessionCard />
          <MappingCard />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <EgressCard />
            <IngressCard />
          </Box>

          <EventsCard />
        </Box>
      </Box>
    </Box>
  );
};

export { App };
