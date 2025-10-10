import { useState } from "react";
import { Popover, Box, Typography, type PaperProps, Divider } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";

const commonPaperProps: PaperProps = {
  sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", boxShadow: 6, width: 360 },
  elevation: 0,
};

const actionAreaSx: PaperProps["sx"] = {
  height: 48,
  p: 1,
  borderTop: 2,
  borderColor: "divider",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 1,
  bgcolor: "background.default",
};

type ConfirmPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
};

const ConfirmPopover = ({ anchorEl, onClose, onConfirm, title, message }: ConfirmPopoverProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Confirm action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      slotProps={{ paper: commonPaperProps }}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, height: 44 }}>
        <WarningAmberRoundedIcon fontSize="small" sx={{ color: "error.main" }} />
        <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
          {title}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {message}
        </Typography>
      </Box>

      <Box sx={actionAreaSx}>
        <GithubButton size="small" onClick={handleClose} disabled={loading} variant="outlined">
          <Typography variant="caption">Cancel</Typography>
        </GithubButton>
        <GithubButton size="small" onClick={handleConfirm} loading={loading} color="error">
          <Typography variant="caption">Confirm</Typography>
        </GithubButton>
      </Box>
    </Popover>
  );
};

export { ConfirmPopover };
