import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Popover, Box, Typography, type PaperProps, Divider } from "@mui/material";
import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import { create } from "zustand";
import type { ConnectionLogLevel } from "@/utils";

const commonPaperProps: PaperProps = {
  sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", boxShadow: 6 },
  elevation: 0,
};

const levels: ConnectionLogLevel[] = ["info", "warn", "error"];

const useFilters = create<{ filters: ConnectionLogLevel[] }>(() => ({ filters: levels }));

const handleSelect = (level: ConnectionLogLevel) => {
  useFilters.setState((state) => {
    const isSelected = state.filters.includes(level);
    const newLevels = isSelected ? state.filters.filter((l) => l !== level) : [...state.filters, level];
    return { filters: newLevels.length > 0 ? newLevels : state.filters };
  });
};

const handleClear = () => {
  useFilters.setState({ filters: levels });
};

type EventsFilterPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
};

const EventsFilterPopover = ({ anchorEl, onClose }: EventsFilterPopoverProps) => {
  const filters = useFilters((state) => state.filters);
  const open = Boolean(anchorEl);

  const options: { value: ConnectionLogLevel; label: string }[] = [
    { value: "info", label: "Info" },
    { value: "warn", label: "Warning" },
    { value: "error", label: "Error" },
  ];

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{ paper: commonPaperProps }}
    >
      <Box sx={{ p: 1, display: "flex", flexDirection: "column" }}>
        {options.map(({ label, value }) => (
          <GithubButton
            key={value}
            size="small"
            onClick={() => handleSelect(value)}
            fullWidth
            sx={{ justifyContent: "space-between", outline: "none" }}
          >
            <Typography variant="body2" sx={centerTextSx}>
              {label}
            </Typography>
            <CheckRoundedIcon fontSize="small" sx={{ visibility: filters.includes(value) ? "visible" : "hidden" }} />
          </GithubButton>
        ))}
      </Box>

      <Divider />

      <Box sx={{ p: 1 }}>
        <GithubButton onClick={handleClear} fullWidth sx={{ outline: "none" }}>
          <Typography variant="body2" sx={centerTextSx}>
            Reset
          </Typography>
        </GithubButton>
      </Box>
    </Popover>
  );
};

export { EventsFilterPopover, useFilters };
