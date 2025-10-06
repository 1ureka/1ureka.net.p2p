import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography } from "@mui/material";

import { useTab } from "@/ui/tabs";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubHeaderButton } from "@/ui/components/Github";
import { EventEntry, useLogs } from "@/ui/components/EventsList";

const Chip = ({ color, text }: { color: string; text: string }) => {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: color, opacity: 0.2 }} />
      <Typography variant="body2" sx={{ position: "relative", textWrap: "nowrap", color, ...centerTextSx }}>
        {text}
      </Typography>
    </Box>
  );
};

const EventsSummary = () => {
  const setTab = useTab((state) => state.setTab);
  const logs = useLogs();
  const warningCount = logs.filter((log) => log.level === "warn").length;
  const errorCount = logs.filter((log) => log.level === "error").length;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
      <GithubHeaderButton StartIcon={ListAltRoundedIcon} onClick={() => setTab("events")}>
        view all logs
      </GithubHeaderButton>

      <Chip color={warningCount > 0 ? "warning.main" : "text.secondary"} text={`${warningCount} warnings`} />
      <Chip color={errorCount > 0 ? "error.main" : "text.secondary"} text={`${errorCount} errors`} />
    </Box>
  );
};

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
    <Box sx={{ height: 350, overflow: "auto" }}>
      {logs.length <= 0 && <NoItemDisplay />}
      {logs.map((log) => (
        <EventEntry key={log.id} log={log} />
      ))}
    </Box>
  );
};

const EventsCard = () => {
  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Events
        </Typography>
        <Box sx={{ flex: 1 }} />
        <EventsSummary />
      </CardHeader>

      <EventsLogs />

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { EventsCard };
