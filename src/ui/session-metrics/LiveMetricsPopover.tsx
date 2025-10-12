import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Popover, Box, Typography, type PaperProps } from "@mui/material";
import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import type { MetricType } from "@/ui/session-metrics/LiveMetrics";

const commonPaperProps: PaperProps = {
  sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", boxShadow: 6 },
  elevation: 0,
};

type LiveMetricsPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  value: MetricType;
  onChange: (value: MetricType) => void;
};

const LiveMetricsPopover = ({ anchorEl, onClose, value, onChange }: LiveMetricsPopoverProps) => {
  const open = Boolean(anchorEl);

  const handleSelect = (metric: MetricType) => {
    onChange(metric);
    onClose();
  };

  const options: { value: MetricType; label: string }[] = [
    { value: "traffic", label: "Traffic" },
    { value: "connections", label: "Connections" },
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
        {options.map((option) => (
          <GithubButton
            key={option.value}
            size="small"
            onClick={() => handleSelect(option.value)}
            fullWidth
            sx={{ justifyContent: "space-between", outline: "none" }}
          >
            <Typography variant="body2" sx={{ textTransform: "capitalize", ...centerTextSx }}>
              {option.label}
            </Typography>
            <CheckRoundedIcon fontSize="small" style={{ visibility: value === option.value ? "visible" : "hidden" }} />
          </GithubButton>
        ))}
      </Box>
    </Popover>
  );
};

export { LiveMetricsPopover };
