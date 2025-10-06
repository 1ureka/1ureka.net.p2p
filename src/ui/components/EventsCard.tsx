import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { Box, Typography } from "@mui/material";
import { useTab } from "@/ui/tabs";

import { Card, CardHeader } from "@/ui/components/Card";
import { GithubHeaderButton } from "@/ui/components/Github";
import { EventEntry, useLogs, NoItemDisplay } from "@/ui/components/EventsList";
import { EventsSummary } from "@/ui/components/EventsSummary";

const EventsLogs = () => {
  const logs = useLogs();

  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {logs.length <= 0 && <NoItemDisplay hasFilters={false} />}
      {logs.map((log) => (
        <EventEntry key={log.id} log={log} />
      ))}
    </Box>
  );
};

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

const EventsCard = () => {
  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <EventsCardHeader />
      <EventsLogs />
      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { EventsCard };
