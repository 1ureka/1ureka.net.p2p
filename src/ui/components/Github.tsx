import { styled } from "@mui/material/styles";
import { Button, type ButtonProps, TextField, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import type { SvgIconComponent } from "@mui/icons-material";

const GithubTextField = styled(TextField)(({ theme }) => ({
  "& .MuiFormLabel-root": { fontSize: "0.85rem" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    backgroundColor: theme.palette.background.paper,
    fontSize: "0.85rem",
    "& fieldset": { borderWidth: 2, fontSize: "0.85rem", borderColor: theme.palette.divider },
    "&:hover fieldset": { borderColor: theme.palette.text.disabled },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& input::placeholder": { color: "#6e7781", opacity: 1 },
  },
}));

const GithubButton = styled(Button)(({ theme }) => ({
  borderRadius: 6,
  color: theme.palette.text.primary,
  textTransform: "none",
  textWrap: "nowrap",
  border: "2px solid",
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  "&:hover": { filter: "brightness(1.2)" },
  fontWeight: "bold",
}));

type GithubHeaderButtonProps = Omit<ButtonProps, "children" | "startIcon" | "endIcon"> & {
  children: string;
  StartIcon?: SvgIconComponent;
  EndIcon?: SvgIconComponent;
};

const GithubHeaderButton = ({ sx, color, children, StartIcon, EndIcon, ...props }: GithubHeaderButtonProps) => {
  return (
    <GithubButton
      sx={{ py: 0.5, px: 1, bgcolor: "background.default", color: color ? `${color}.main` : undefined, ...sx }}
      startIcon={StartIcon ? <StartIcon fontSize="small" /> : null}
      endIcon={EndIcon ? <EndIcon fontSize="small" /> : null}
      color={color}
      {...props}
    >
      <Typography variant="body2" sx={{ textTransform: "none", textWrap: "nowrap", color: "inherit", ...centerTextSx }}>
        {children}
      </Typography>
    </GithubButton>
  );
};

export { GithubButton, GithubTextField, GithubHeaderButton };
