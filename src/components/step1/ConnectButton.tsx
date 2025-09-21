import { Button, type ButtonProps } from "@mui/material";
import { buttonContainedSx } from "@/components/utils";

const ConnectButton = ({ loading, disabled, onClick }: ButtonProps) => {
  return (
    <Button
      variant="contained"
      size="large"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      fullWidth
      sx={{
        ...buttonContainedSx,
        "&:hover": { scale: "1.01", bgcolor: "primary.light" },
        "&:active": { scale: "0.99" },
        py: 1.5,
        px: 4,
        fontSize: "1.1rem",
      }}
    >
      開始連接
    </Button>
  );
};

export { ConnectButton };
