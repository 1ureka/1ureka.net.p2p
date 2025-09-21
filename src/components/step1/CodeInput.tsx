import { TextField, type TextFieldProps } from "@mui/material";

type CodeInputProps = Omit<TextFieldProps, "onChange"> & {
  onChange: (value: string) => void;
};

const CodeInput = ({ value, onChange, disabled, placeholder, error, helperText }: CodeInputProps) => {
  return (
    <TextField
      label="連接代碼"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      variant="filled"
      fullWidth
      sx={{
        "& .MuiFilledInput-root": {
          borderRadius: 2,
        },
        // 將底下的橫線去除
        "& .MuiFilledInput-underline:before, & .MuiFilledInput-underline:after": {
          display: "none",
        },
      }}
    />
  );
};

export { CodeInput };
