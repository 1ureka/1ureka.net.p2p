import { z } from "zod";
import { useState, useEffect } from "react";
import { Popover, Box, Typography, Alert, type PaperProps } from "@mui/material";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";

import { GithubTextField, GithubHeaderButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import { handleCreateMapping, handleCreateRule } from "@/adapter/store";
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

const actionAreaSx: Record<"container" | "button", PaperProps["sx"]> = {
  container: {
    p: 1,
    borderTop: 2,
    borderColor: "divider",
    display: "grid",
    justifyItems: "end",
    bgcolor: "background.default",
  },
  button: { bgcolor: "background.paper" },
};

type RouteCardPopoverProps = {
  anchorEl: null | HTMLElement;
  onClose: () => void;
};

const CreateMappingPopover = ({ anchorEl, onClose }: RouteCardPopoverProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [srcAddr, setSrcAddr] = useState("127.0.0.1");
  const [srcPort, setSrcPort] = useState("");
  const [dstAddr, setDstAddr] = useState("127.0.0.1");
  const [dstPort, setDstPort] = useState("");

  const resetForm = () => {
    setSrcAddr("127.0.0.1");
    setSrcPort("");
    setDstAddr("127.0.0.1");
    setDstPort("");
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
      const validatedMapping = mappingSchema.parse({ srcAddr, srcPort, dstAddr, dstPort });

      const mapping: SocketPair = {
        srcAddr: validatedMapping.srcAddr,
        srcPort: validatedMapping.srcPort,
        dstAddr: validatedMapping.dstAddr,
        dstPort: validatedMapping.dstPort,
      };

      const result = await handleCreateMapping(mapping);
      if (!result) throw new Error("Failed to create mapping");

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
          Add New Mapping
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1, alignItems: "center" }}>
            <GithubTextField
              label="Source Address"
              value={srcAddr}
              onChange={(e) => setSrcAddr(e.target.value)}
              size="small"
              placeholder="127.0.0.1"
              disabled={loading}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              :
            </Typography>
            <GithubTextField
              label="Source Port"
              value={srcPort}
              onChange={(e) => setSrcPort(e.target.value)}
              size="small"
              placeholder="8080"
              disabled={loading}
              fullWidth
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
              value={dstAddr}
              onChange={(e) => setDstAddr(e.target.value)}
              size="small"
              placeholder="127.0.0.1"
              disabled={loading}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              :
            </Typography>
            <GithubTextField
              label="Destination Port"
              value={dstPort}
              onChange={(e) => setDstPort(e.target.value)}
              size="small"
              placeholder="3000"
              disabled={loading}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={actionAreaSx.container}>
        <GithubHeaderButton
          StartIcon={AddBoxRoundedIcon}
          sx={actionAreaSx.button}
          onClick={handleSubmit}
          loading={loading}
        >
          Add mapping
        </GithubHeaderButton>
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
      const validatedPattern = patternSchema.parse(pattern);

      const result = await handleCreateRule(validatedPattern);
      if (!result) throw new Error("Failed to create rule");

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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          )}

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
            helperText="Define access patterns for incoming connections"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
          />
        </Box>
      </Box>

      <Box sx={actionAreaSx.container}>
        <GithubHeaderButton
          StartIcon={AddBoxRoundedIcon}
          sx={actionAreaSx.button}
          onClick={handleSubmit}
          loading={loading}
        >
          Add rule
        </GithubHeaderButton>
      </Box>
    </Popover>
  );
};

export { CreateMappingPopover, CreateRulePopover };
