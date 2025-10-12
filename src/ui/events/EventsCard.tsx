import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { EventsList, useLogs } from "@/ui/events/EventsList";
import { EventsSummary } from "@/ui/events/EventsSummary";
import { EventsFilterPopover, useFilters } from "@/ui/events/EventsFilterPopover";

const EventsCardHeader = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenPopover = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClosePopover = () => setAnchorEl(null);

  return (
    <CardHeader>
      <Typography variant="subtitle1" component="h2">
        Events
      </Typography>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <EventsSummary />

        <GithubTooltip title="Filter events">
          <GithubButton size="small" onClick={handleOpenPopover}>
            <FilterListRoundedIcon fontSize="small" sx={{ mx: 0.5 }} />
            <ExpandMoreRoundedIcon fontSize="small" />
          </GithubButton>
        </GithubTooltip>
      </Box>

      <EventsFilterPopover anchorEl={anchorEl} onClose={handleClosePopover} />
    </CardHeader>
  );
};

const EventsCardBody = () => {
  const allLogs = useLogs();
  const filters = useFilters((state) => state.filters);

  const filteredLogs = allLogs.filter((log) => filters.includes(log.level));
  const hasFilters = filters.length < 3;

  return <EventsList logs={filteredLogs} hasFilters={hasFilters} />;
};

const EventsCard = () => (
  <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <EventsCardHeader />
    <EventsCardBody />
  </Card>
);

export { EventsCard };
