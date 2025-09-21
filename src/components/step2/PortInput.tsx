import { TextField, type TextFieldProps } from "@mui/material";

type PortInputProps = Omit<TextFieldProps, "onChange"> & {
  onChange: (value: string) => void;
};

const PortInput = ({ value, onChange, disabled, placeholder, error, helperText }: PortInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // 只允許數字
    if (/^\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <TextField
      label="TCP 伺服器端口"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder || "輸入 TCP 伺服器端口號 (例: 8080)"}
      error={error}
      helperText={helperText}
      variant="filled"
      fullWidth
      size="small"
      inputProps={{
        inputMode: "numeric",
        pattern: "[0-9]*",
        min: 1,
        max: 65535,
      }}
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

export { PortInput };
