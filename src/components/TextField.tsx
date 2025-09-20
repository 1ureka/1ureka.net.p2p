import { Box, TextField, IconButton, Tooltip } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { transition } from "./utils";
import { tryCatch } from "@/utils";
import { useRef, useState } from "react";

type TextFieldWithClipboardProps = {
  label: string;
  disabled?: boolean;
  mode: "copy" | "paste";
  value: string;
  onChange: (value: string) => void;
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 2, "&.Mui-disabled": { bgcolor: "action.hover" } },
};

const buttonSx = {
  p: 0.5,
  borderRadius: 2,
  bgcolor: "action.hover",
  "&:hover": { bgcolor: "action.selected", scale: "1.02" },
  "&:active": { scale: "0.98" },
  transition,
};

function TextFieldWithClipboard({ label, disabled, mode, value, onChange }: TextFieldWithClipboardProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClipboard = async () => {
    if (timeout.current) clearTimeout(timeout.current);

    if (mode === "copy") {
      const { error } = await tryCatch(navigator.clipboard.writeText(value));
      if (error) return console.error("複製失敗:", error);
    } else if (mode === "paste") {
      const { data: text, error } = await tryCatch(navigator.clipboard.readText());
      if (error) return console.error("貼上失敗:", error);
      onChange(text);
    }

    setShowSuccess(true);
    timeout.current = setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleChange: TextFieldProps["onChange"] = (e) => {
    onChange(e.target.value);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        placeholder={label}
        disabled={disabled}
        fullWidth
        multiline
        rows={8}
        value={value}
        onChange={handleChange}
        sx={textFieldSx}
      />

      <Box sx={{ position: "absolute", inset: "auto 0 0 auto", p: 2 }}>
        <Tooltip title={showSuccess ? "成功!" : mode === "copy" ? "複製" : "貼上"}>
          <IconButton size="small" onClick={handleClipboard} sx={buttonSx}>
            {showSuccess ? (
              <CheckRoundedIcon
                fontSize="small"
                sx={{
                  color: "success.main",
                  animation: "checkPulse 0.6s ease-out",
                  "@keyframes checkPulse": {
                    "0%": { transform: "scale(0)", opacity: 0 },
                    "50%": { transform: "scale(1.2)", opacity: 1 },
                    "100%": { transform: "scale(1)", opacity: 1 },
                  },
                }}
              />
            ) : mode === "copy" ? (
              <ContentCopyRoundedIcon fontSize="small" />
            ) : (
              <ContentPasteRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export { TextFieldWithClipboard as TextField };
