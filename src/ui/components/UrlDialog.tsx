import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import OpenInBrowserRoundedIcon from "@mui/icons-material/OpenInBrowserRounded";
import { Dialog, Box, Typography, Grow, type PaperProps } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";

const commonPaperProps: PaperProps = {
  sx: { borderRadius: 3, border: "2px solid", borderColor: "divider", width: 600 },
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
  bgcolor: "background.default",
};

type UrlDialogProps = {
  open: boolean;
  url: string;
  onClose: () => void;
};

const UrlDialog = ({ open, url, onClose }: UrlDialogProps) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }
  }, [open]);

  const handleCopy = async () => {
    if (timer.current !== null) clearTimeout(timer.current);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: commonPaperProps }} slots={{ transition: Grow }}>
      <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <OpenInBrowserRoundedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ ...centerTextSx }}>
            Open in Browser
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Please copy the URL below and open it in your browser:
        </Typography>

        <Box
          sx={{
            p: 1.5,
            bgcolor: "background.default",
            borderRadius: 1.5,
            border: "2px solid",
            borderColor: "divider",
            fontFamily: "Ubuntu",
            fontSize: "0.85rem",
            wordBreak: "break-all",
            color: "primary.main",
          }}
        >
          {url}
        </Box>
      </Box>

      <Box sx={actionAreaSx}>
        <GithubButton size="small" onClick={handleCopy} disabled={copied} color={copied ? "primary" : undefined}>
          {copied ? <DoneRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
          <Typography variant="caption" sx={centerTextSx}>
            {copied ? "Copied!" : "Copy URL"}
          </Typography>
        </GithubButton>
      </Box>
    </Dialog>
  );
};

export { UrlDialog };
