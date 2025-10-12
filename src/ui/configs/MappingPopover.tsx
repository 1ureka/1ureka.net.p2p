import { z } from "zod";
import { useState, useEffect } from "react";
import { Popover, Box, Typography, Checkbox, FormControlLabel, type PaperProps } from "@mui/material";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";

import { GithubTextField, GithubButton, GithubTooltip } from "@/ui/components/Github";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { handleCreateMapping } from "@/adapter-state/handlers";
import type { SocketPair } from "@/adapter/ip";

const addressSchema = z.string().min(1, "Address is required").trim();
const portSchema = z
  .string()
  .min(1, "Port is required")
  .refine((val) => !isNaN(Number(val)), "Port must be a number")
  .transform((val) => Number(val))
  .refine((val) => val >= 1 && val <= 65535, "Port must be between 1 and 65535");

const mappingSchema = z.object({
  srcAddr: addressSchema,
  srcPort: portSchema,
  dstAddr: addressSchema,
  dstPort: portSchema,
});

const commonPaperProps: PaperProps = {
  sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", boxShadow: 6, width: 400 },
  elevation: 0,
};

const actionAreaSx: PaperProps["sx"] = {
  height: 48,
  p: 1,
  borderTop: 2,
  borderColor: "divider",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  bgcolor: "background.default",
};

type ConfigsCardPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
};

const CreateMappingPopover = ({ anchorEl, onClose }: ConfigsCardPopoverProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SocketPair, string>>>({});
  const [map, setMap] = useState({ srcAddr: "127.0.0.1", srcPort: "", dstAddr: "127.0.0.1", dstPort: "" });
  const [autoMirror, setAutoMirror] = useState(true);

  const resetForm = () => {
    setMap({ srcAddr: "127.0.0.1", srcPort: "", dstAddr: "127.0.0.1", dstPort: "" });
    setErrors({});
    setLoading(false);
    setAutoMirror(true);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  // 自動鏡像邏輯
  useEffect(() => {
    if (autoMirror) {
      setMap((prev) => ({
        ...prev,
        dstAddr: prev.srcAddr,
        dstPort: prev.srcPort,
      }));
    }
  }, [autoMirror, map.srcAddr, map.srcPort]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = async () => {
    setErrors({});
    setLoading(true);

    try {
      await handleCreateMapping(mappingSchema.parse(map));
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof SocketPair, string>> = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as keyof SocketPair;
          if (field) newErrors[field] = issue.message;
        });
        setErrors(newErrors);
      } else {
        const errMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setErrors({ srcAddr: errMessage, dstAddr: errMessage, srcPort: errMessage, dstPort: errMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: commonPaperProps }}
    >
      <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
        <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
          Add new mapping
        </Typography>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1, alignItems: "center" }}>
          <GithubTextField
            label="Source Address"
            value={map.srcAddr}
            onChange={(e) => setMap((prev) => ({ ...prev, srcAddr: e.target.value }))}
            size="small"
            placeholder="127.0.0.1"
            disabled={loading}
            fullWidth
            error={Boolean(errors.srcAddr)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            :
          </Typography>
          <GithubTextField
            label="Source Port"
            value={map.srcPort}
            onChange={(e) => setMap((prev) => ({ ...prev, srcPort: e.target.value }))}
            size="small"
            placeholder="8080"
            disabled={loading}
            fullWidth
            error={Boolean(errors.srcPort)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            ↓
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1, alignItems: "center" }}>
          <GithubTextField
            label="Destination Address"
            value={map.dstAddr}
            onChange={(e) => setMap((prev) => ({ ...prev, dstAddr: e.target.value }))}
            size="small"
            placeholder="127.0.0.1"
            disabled={loading || autoMirror}
            fullWidth
            error={Boolean(errors.dstAddr)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            :
          </Typography>
          <GithubTextField
            label="Destination Port"
            value={map.dstPort}
            onChange={(e) => setMap((prev) => ({ ...prev, dstPort: e.target.value }))}
            size="small"
            placeholder="3000"
            disabled={loading || autoMirror}
            fullWidth
            error={Boolean(errors.dstPort)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
          />
        </Box>

        {Array.from(new Set(Object.values(errors))).length > 0 && (
          <Typography variant="caption" color="error" sx={{ ...ellipsisSx, WebkitLineClamp: 2 }}>
            {Array.from(new Set(Object.values(errors))).join(", ")}
          </Typography>
        )}
      </Box>

      <Box sx={actionAreaSx}>
        <GithubTooltip title="Automatically use the same address and port for destination">
          <FormControlLabel
            control={
              <Checkbox
                checked={autoMirror}
                onChange={(e) => setAutoMirror(e.target.checked)}
                size="small"
                disabled={loading}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: "text.secondary", ...centerTextSx }}>
                Auto mirror
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </GithubTooltip>

        <GithubButton size="small" onClick={handleSubmit} loading={loading}>
          <AddBoxRoundedIcon fontSize="small" />
          <Typography variant="caption" sx={centerTextSx}>
            Add mapping
          </Typography>
        </GithubButton>
      </Box>
    </Popover>
  );
};

export { CreateMappingPopover };
