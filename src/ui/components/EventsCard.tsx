import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography } from "@mui/material";

import { useTab } from "@/ui/tabs";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubHeaderButton } from "@/ui/components/Github";
import { EventEntry, useLogs } from "@/ui/components/EventsList";
import { EventsSummary } from "@/ui/components/EventsSummary";

const NoItemDisplay = () => {
  const title = "No events yet";
  const description =
    "There are no connection events to display. Logs will appear here once the system starts running.";
  return (
    <Box sx={{ display: "grid", placeItems: "center", height: 1 }}>
      <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>
        <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

        <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

const EventsLogs = () => {
  const logs = useLogs();

  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {logs.length <= 0 && <NoItemDisplay />}
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
