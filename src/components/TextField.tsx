import { Box, TextField, IconButton, Tooltip } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import { transition, tryCatch } from "./utils";

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
  const handleClipboard = async () => {
    if (mode === "copy") {
      const { error } = await tryCatch(navigator.clipboard.writeText(value));
      if (error) return console.error("複製失敗:", error);
    } else if (mode === "paste") {
      const { data: text, error } = await tryCatch(navigator.clipboard.readText());
      if (error) return console.error("貼上失敗:", error);
      onChange(text);
    }
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
        <Tooltip title={mode === "copy" ? "複製" : "貼上"}>
          <IconButton size="small" onClick={handleClipboard} sx={buttonSx}>
            {mode === "copy" ? (
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
