import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { Box, Typography } from "@mui/material";
import { useTab } from "@/ui/tabs";

import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton } from "@/ui/components/Github";
import { EventsList, useLogs } from "@/ui/components/EventsList";
import { EventsSummary } from "@/ui/components/EventsSummary";

const LinkButton = () => {
  const setTab = useTab((state) => state.setTab);
  return (
    <GithubButton onClick={() => setTab("events")} size="small">
      <ListAltRoundedIcon fontSize="small" />
      <Typography variant="body2" sx={centerTextSx}>
        View all
      </Typography>
    </GithubButton>
  );
};

const EventsCardHeader = () => (
  <CardHeader>
    <Typography variant="subtitle1" component="h2">
      Events
    </Typography>

    <Box sx={{ flex: 1 }} />

    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
      <LinkButton />
      <EventsSummary display={{ info: false, warn: true, error: true, total: false }} />
    </Box>
  </CardHeader>
);

const EventsCardBody = () => {
  const logs = useLogs();
  return <EventsList logs={logs} hasFilters={false} />;
};

const EventsCard = () => (
  <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <EventsCardHeader />
    <EventsCardBody />
  </Card>
);

export { EventsCard };
