import { Box, Typography } from "@mui/material";
import { useFilter, FilterButtons, ClearFiltersButton } from "@/ui/events/EventsFilter";
import { Card, CardHeader, CardSubHeader } from "@/ui/components/Card";
import { EventsList, useLogs } from "@/ui/events/EventsList";
import { EventsSummary } from "@/ui/events/EventsSummary";

const EventsCardHeader = () => (
  <CardHeader>
    <Typography variant="subtitle1" component="h2">
      Events
    </Typography>

    <Box sx={{ flex: 1 }} />

    <EventsSummary />
  </CardHeader>
);

const EventsCardSubHeader = () => (
  <CardSubHeader>
    <FilterButtons />
    <ClearFiltersButton />
  </CardSubHeader>
);

const EventsCardBody = () => {
  const allLogs = useLogs();
  const filters = useFilter((state) => state.filters);

  const filteredLogs = allLogs.filter((log) => filters.includes(log.level));
  const hasFilters = filters.length < 3;

  return <EventsList logs={filteredLogs} hasFilters={hasFilters} />;
};

const EventsCard = () => (
  <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <EventsCardHeader />
    <EventsCardSubHeader />
    <EventsCardBody />
  </Card>
);

export { EventsCard };
