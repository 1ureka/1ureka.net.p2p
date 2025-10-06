import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { Box, Typography } from "@mui/material";
import { useTab } from "@/ui/tabs";

import { Card, CardHeader } from "@/ui/components/Card";
import { GithubHeaderButton } from "@/ui/components/Github";
import { EventsList, useLogs } from "@/ui/components/EventsList";
import { EventsSummary } from "@/ui/components/EventsSummary";

const EventsCardHeader = () => {
  const setTab = useTab((state) => state.setTab);
  const logs = useLogs();

  return (
    <CardHeader>
      <Typography variant="subtitle1" component="h2">
        Events
      </Typography>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
        <GithubHeaderButton StartIcon={ListAltRoundedIcon} onClick={() => setTab("events")}>
          view all logs
        </GithubHeaderButton>

        <EventsSummary logs={logs} display={{ info: false, warn: true, error: true, total: false }} />
      </Box>
    </CardHeader>
  );
};

const EventsCardBody = () => {
  const logs = useLogs();
  return <EventsList logs={logs} hasFilters={false} />;
};

const EventsCard = () => {
  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <EventsCardHeader />
      <EventsCardBody />
      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { EventsCard };
