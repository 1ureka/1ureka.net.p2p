import { useMemo, memo } from "react";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { Box, Typography } from "@mui/material";
import { create } from "zustand";

import type { ConnectionLogLevel } from "@/utils";
import { centerTextSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { EventsList, useLogs } from "@/ui/events/EventsList";
import { EventsSummary } from "@/ui/events/EventsSummary";

const levels: ConnectionLogLevel[] = ["info", "warn", "error"];

const useLevelStore = create<{
  selectedLevels: ConnectionLogLevel[];
  setSelectedLevels: (levels: ConnectionLogLevel[]) => void;
}>((set) => ({
  selectedLevels: levels,
  setSelectedLevels: (levels) => set({ selectedLevels: levels }),
}));

const ClearFiltersButton = () => {
  const { selectedLevels, setSelectedLevels } = useLevelStore();
  const hasFilters = selectedLevels.length < 3;

  return (
    <GithubButton
      sx={{ py: 0.5, px: 1.5, bgcolor: "background.paper" }}
      disabled={!hasFilters}
      onClick={() => setSelectedLevels(levels)}
    >
      <Typography variant="body2" sx={centerTextSx}>
        Clear filters
      </Typography>
    </GithubButton>
  );
};

const LevelFilter = () => {
  const { selectedLevels, setSelectedLevels } = useLevelStore();

  const handleToggle = (level: ConnectionLogLevel) => {
    const newLevels = isSelected(level) ? selectedLevels.filter((l) => l !== level) : [...selectedLevels, level];
    if (newLevels.length > 0) setSelectedLevels(newLevels);
  };

  const isSelected = (level: ConnectionLogLevel) => selectedLevels.includes(level);
  const buttonSx = (level: ConnectionLogLevel) => ({
    py: 0.5,
    px: 1.5,
    bgcolor: isSelected(level) ? "background.default" : "background.paper",
    opacity: isSelected(level) ? 1 : 0.5,
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Level:
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, height: "1.5rem" }}>
        {levels.map((level) => (
          <GithubButton key={level} sx={buttonSx(level)} onClick={() => handleToggle(level)}>
            <Typography variant="body2" sx={{ ...centerTextSx, fontFamily: "Ubuntu" }}>
              {level.toUpperCase()}
            </Typography>
          </GithubButton>
        ))}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------

const EventsPageHeader = () => (
  <CardHeader>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <ListAltRoundedIcon />
      <Typography variant="subtitle1" component="h2">
        Events
      </Typography>
    </Box>

    <Box sx={{ flex: 1 }} />

    <EventsSummary display={{ total: true, info: true, warn: true, error: true }} />
  </CardHeader>
);

const EventsPageActions = () => (
  <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FilterListRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: "text.secondary", ...centerTextSx }}>
          Filters:
        </Typography>
      </Box>
      <LevelFilter />
      <ClearFiltersButton />
    </Box>
  </Box>
);

const EventsPageBody = () => {
  const allLogs = useLogs();
  const { selectedLevels } = useLevelStore();

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => selectedLevels.includes(log.level));
  }, [allLogs, selectedLevels]);

  const hasFilters = selectedLevels.length < 3;

  return <EventsList logs={filteredLogs} hasFilters={hasFilters} />;
};

const EventsPage = memo(() => (
  <Box sx={{ px: 4, py: 3, flex: 1, display: "flex", flexDirection: "column", minHeight: 500 }}>
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <EventsPageHeader />
      <EventsPageActions />
      <EventsPageBody />
    </Card>
  </Box>
));

EventsPage.displayName = "EventsPage";

export { EventsPage };
