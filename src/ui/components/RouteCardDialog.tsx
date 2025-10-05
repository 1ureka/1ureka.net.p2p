import { z } from "zod";
import { useState, useEffect } from "react";
import { Popover, Box, Typography, Alert } from "@mui/material";
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

type RouteCardDialogProps = {
  anchorEl: null | HTMLElement;
  type: "mapping" | "rule";
  onClose: () => void;
};

const RouteCardDialog = ({ anchorEl, type, onClose }: RouteCardDialogProps) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapping 相關的狀態
  const [srcAddr, setSrcAddr] = useState("127.0.0.1");
  const [srcPort, setSrcPort] = useState("");
  const [dstAddr, setDstAddr] = useState("127.0.0.1");
  const [dstPort, setDstPort] = useState("");

  // Rule 相關的狀態
  const [pattern, setPattern] = useState("");

  // 重置表單
  const resetForm = () => {
    setSrcAddr("127.0.0.1");
    setSrcPort("");
    setDstAddr("127.0.0.1");
    setDstPort("");
    setPattern("");
    setError(null);
    setLoading(false);
  };

  // 當 dialog 關閉時重置表單
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (type === "mapping") {
        // 使用 zod 驗證 mapping 輸入
        const validatedMapping = mappingSchema.parse({ srcAddr, srcPort, dstAddr, dstPort });

        const mapping: SocketPair = {
          srcAddr: validatedMapping.srcAddr,
          srcPort: validatedMapping.srcPort,
          dstAddr: validatedMapping.dstAddr,
          dstPort: validatedMapping.dstPort,
        };

        const result = await handleCreateMapping(mapping);
        if (!result) {
          throw new Error("Failed to create mapping");
        }
      } else {
        // 使用 zod 驗證 rule 輸入
        const validatedPattern = patternSchema.parse(pattern);

        const result = await handleCreateRule(validatedPattern);
        if (!result) {
          throw new Error("Failed to create rule");
        }
      }

      // 成功後關閉 dialog
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // 處理 zod 驗證錯誤
        const firstError = err.issues[0];
        setError(firstError.message);
      } else {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const title = type === "mapping" ? "Add New Mapping" : "Add New Rule";

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", boxShadow: 6, width: 400 },
          elevation: 0,
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
        <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          {type === "mapping" && (
            <>
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
            </>
          )}

          {type === "rule" && (
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
          )}
        </Box>
      </Box>

      <Box
        sx={{
          p: 1,
          borderTop: 2,
          borderColor: "divider",
          gap: 1,
          display: "grid",
          justifyItems: "end",
          bgcolor: "background.default",
        }}
      >
        <GithubHeaderButton
          StartIcon={AddBoxRoundedIcon}
          sx={{ bgcolor: "background.paper" }}
          onClick={handleSubmit}
          loading={loading}
        >
          {type === "mapping" ? "Add mapping" : "Add rule"}
        </GithubHeaderButton>
      </Box>
    </Popover>
  );
};

export { RouteCardDialog };
