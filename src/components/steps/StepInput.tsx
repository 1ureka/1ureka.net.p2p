import { TextField, type TextFieldProps } from "@mui/material";

type StepInputProps = Omit<TextFieldProps, "onChange"> & {
  onChange: (value: string) => void;
};

const StepInput = ({ value, onChange, disabled, placeholder, error, helperText }: StepInputProps) => {
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
      size="small"
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

export { StepInput };
