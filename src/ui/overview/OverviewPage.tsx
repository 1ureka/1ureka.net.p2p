import { memo } from "react";
import { Box } from "@mui/material";
import { EventsCard } from "@/ui/events/EventsCard";
import { SessionCard } from "@/ui/overview/session/SessionCard";
import { RouteCard } from "@/ui/components/RouteCard";

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

export { OverviewPage };
