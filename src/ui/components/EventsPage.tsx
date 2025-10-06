import { useState, useMemo } from "react";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { Box, Typography } from "@mui/material";

import type { ConnectionLogEntry, ConnectionLogLevel } from "@/utils";
import { centerTextSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { EventEntry, useLogs, NoItemDisplay } from "@/ui/components/EventsList";
import { EventsSummary } from "@/ui/components/EventsSummary";

type LevelFilterProps = {
  selectedLevels: ConnectionLogLevel[];
  onChange: (levels: ConnectionLogLevel[]) => void;
};

const levels: ConnectionLogLevel[] = ["info", "warn", "error"];

const LevelFilter = ({ selectedLevels, onChange }: LevelFilterProps) => {
  const handleToggle = (level: ConnectionLogLevel) => {
    const newLevels = isSelected(level) ? selectedLevels.filter((l) => l !== level) : [...selectedLevels, level];
    if (newLevels.length > 0) onChange(newLevels);
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

const EventsLogs = ({ logs, hasFilters }: { logs: ConnectionLogEntry[]; hasFilters: boolean }) => {
  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {logs.length <= 0 && <NoItemDisplay hasFilters={hasFilters} />}
      {logs.map((log) => (
        <EventEntry key={log.id} log={log} />
      ))}
    </Box>
  );
};

const EventsPage = () => {
  const allLogs = useLogs();
  const [selectedLevels, setSelectedLevels] = useState<ConnectionLogLevel[]>(levels);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => selectedLevels.includes(log.level));
  }, [allLogs, selectedLevels]);

  const hasFilters = selectedLevels.length < 3;

  return (
    <Box sx={{ px: 4, py: 3, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CardHeader>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ListAltRoundedIcon />
            <Typography variant="subtitle1" component="h2">
              Events
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <EventsSummary logs={filteredLogs} display={{ total: true, info: true, warn: true, error: true }} />
        </CardHeader>

        <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: "text.secondary", ...centerTextSx }}>
                Filters:
              </Typography>
            </Box>

            <LevelFilter selectedLevels={selectedLevels} onChange={setSelectedLevels} />

            <GithubButton
              sx={{ py: 0.5, px: 1.5, bgcolor: "background.paper" }}
              disabled={!hasFilters}
              onClick={() => setSelectedLevels(levels)}
            >
              <Typography variant="body2" sx={centerTextSx}>
                Clear filters
              </Typography>
            </GithubButton>
          </Box>
        </Box>

        <EventsLogs logs={filteredLogs} hasFilters={hasFilters} />

        <Box sx={{ p: 1 }} />
      </Card>
    </Box>
  );
};

export { EventsPage };
