import { z } from "zod";
import { useState, useEffect } from "react";
import { Popover, Box, Typography, type PaperProps } from "@mui/material";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";

import { GithubTextField, GithubButton } from "@/ui/components/Github";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { handleCreateMapping, handleCreateRule } from "@/adapter-state/handlers";
import type { SocketPair } from "@/adapter/ip";

const addressSchema = z.string().min(1, "Address is required").trim();
const portSchema = z
  .string()
  .min(1, "Port is required")
  .refine((val) => !isNaN(Number(val)), "Port must be a number")
  .transform((val) => Number(val))
  .refine((val) => val >= 1 && val <= 65535, "Port must be between 1 and 65535");

const patternSchema = z.string().min(1, "Pattern is required").trim();
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
  p: 1,
  borderTop: 2,
  borderColor: "divider",
  display: "grid",
  justifyItems: "end",
  bgcolor: "background.default",
};

type RouteCardPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
};

const CreateMappingPopover = ({ anchorEl, onClose }: RouteCardPopoverProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SocketPair, string>>>({});
  const [map, setMap] = useState({ srcAddr: "127.0.0.1", srcPort: "", dstAddr: "127.0.0.1", dstPort: "" });

  const resetForm = () => {
    setMap({ srcAddr: "127.0.0.1", srcPort: "", dstAddr: "127.0.0.1", dstPort: "" });
    setErrors({});
    setLoading(false);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

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
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{ paper: commonPaperProps }}
    >
      <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
        <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
          Add New Mapping
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
            disabled={loading}
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
            disabled={loading}
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
        <GithubButton size="small" onClick={handleSubmit} loading={loading}>
          <AddBoxRoundedIcon fontSize="small" />
          <Typography variant="body2" sx={centerTextSx}>
            Add mapping
          </Typography>
        </GithubButton>
      </Box>
    </Popover>
  );
};

const CreateRulePopover = ({ anchorEl, onClose }: RouteCardPopoverProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState("");

  const resetForm = () => {
    setPattern("");
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      await handleCreateRule(patternSchema.parse(pattern));
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
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
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{ paper: commonPaperProps }}
    >
      <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
        <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
          Add New Rule
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <GithubTextField
          label="Pattern"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          size="small"
          placeholder="127.0.0.1:*"
          disabled={loading}
          fullWidth
          multiline
          rows={2}
          error={Boolean(error)}
          helperText={error ? error : "Define access patterns for incoming connections"}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
        />
      </Box>

      <Box sx={actionAreaSx}>
        <GithubButton size="small" onClick={handleSubmit} loading={loading}>
          <AddBoxRoundedIcon fontSize="small" />
          <Typography variant="body2" sx={centerTextSx}>
            Add rule
          </Typography>
        </GithubButton>
      </Box>
    </Popover>
  );
};

export { CreateMappingPopover, CreateRulePopover };
