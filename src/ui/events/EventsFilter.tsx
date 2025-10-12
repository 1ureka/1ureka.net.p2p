import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { create } from "zustand";
import { Box, Typography } from "@mui/material";
import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import type { ConnectionLogLevel } from "@/utils";

const levels: ConnectionLogLevel[] = ["info", "warn", "error"];

const useFilter = create<{ filters: ConnectionLogLevel[]; setFilters: (levels: ConnectionLogLevel[]) => void }>(
  (set) => ({ filters: levels, setFilters: (levels) => set({ filters: levels }) })
);

const ClearFiltersButton = () => {
  const { filters, setFilters } = useFilter();
  const hasFilters = filters.length < 3;

  return (
    <GithubButton disabled={!hasFilters} onClick={() => setFilters(levels)}>
      <Typography variant="body2" sx={centerTextSx}>
        Clear filters
      </Typography>
    </GithubButton>
  );
};

const FilterButtons = () => {
  const { filters, setFilters } = useFilter();

  const handleToggle = (level: ConnectionLogLevel) => {
    const newLevels = isSelected(level) ? filters.filter((l) => l !== level) : [...filters, level];
    if (newLevels.length > 0) setFilters(newLevels);
  };

  const isSelected = (level: ConnectionLogLevel) => filters.includes(level);
  const buttonSx = (level: ConnectionLogLevel) => ({
    bgcolor: isSelected(level) ? "background.default" : "background.paper",
    opacity: isSelected(level) ? 1 : 0.5,
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <FilterListRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="body2" sx={{ color: "text.secondary", ...centerTextSx }}>
          Level:
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, height: "1.5rem" }}>
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

export { ClearFiltersButton, FilterButtons, useFilter };
