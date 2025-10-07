import { styled } from "@mui/material/styles";
import { Box, Button, TextField, Tooltip, tooltipClasses, Typography } from "@mui/material";
import type { BoxProps, ButtonProps, TooltipProps } from "@mui/material";
import { centerTextSx, generateColorMix, theme } from "@/ui/theme";
import type { SvgIconComponent } from "@mui/icons-material";

const GithubTooltip = ({ slotProps, children, boxProps, ...props }: TooltipProps & { boxProps?: BoxProps }) => (
  <Tooltip
    enterDelay={0}
    slotProps={{
      popper: {
        sx: {
          [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {
            marginTop: "5px",
          },
          [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: {
            marginBottom: "5px",
          },
          [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]: {
            marginLeft: "5px",
          },
          [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]: {
            marginRight: "5px",
          },
        },
      },
      tooltip: {
        sx: {
          backgroundColor: (theme) => theme.palette.background.tooltip,
          color: (theme) => theme.palette.text.primary,
          borderRadius: "0.375rem",
          fontSize: "0.75rem",
          p: 1.25,
          ...centerTextSx,
        },
      },
      ...slotProps,
    }}
    {...props}
  >
    <Box {...boxProps}>{children}</Box>
  </Tooltip>
);

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
  minWidth: "fit-content",
  borderRadius: 6,
  color: theme.palette.text.primary,
  textTransform: "none",
  textWrap: "nowrap",
  border: "none",
  outline: "2px solid",
  outlineColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  "&:hover": { filter: "brightness(1.2)" },
  fontWeight: "bold",
}));

const GithubIconButton = styled(GithubButton)(({ theme }) => ({
  padding: theme.spacing(0.3),
}));

type GithubHeaderButtonProps = Omit<ButtonProps, "children" | "startIcon" | "endIcon" | "color"> & {
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  children: string;
  StartIcon?: SvgIconComponent;
  EndIcon?: SvgIconComponent;
};

const GithubHeaderButton = ({ sx, color, children, StartIcon, EndIcon, ...props }: GithubHeaderButtonProps) => {
  const buttonSx: ButtonProps["sx"] = {
    py: 0.5,
    px: 1,
    bgcolor: "background.default",
    color: color ? `${color}.main` : undefined,
    borderColor: color ? generateColorMix(theme.palette[color].main, "#0000", 50) : undefined,
    ...sx,
  };

  const textSx: ButtonProps["sx"] = {
    textTransform: "none",
    textWrap: "nowrap",
    color: "inherit",
    ...centerTextSx,
  };

  return (
    <GithubButton
      sx={buttonSx}
      startIcon={StartIcon ? <StartIcon fontSize="small" /> : null}
      endIcon={EndIcon ? <EndIcon fontSize="small" /> : null}
      color={color}
      variant="outlined"
      {...props}
    >
      <Typography variant="body2" sx={textSx}>
        {children}
      </Typography>
    </GithubButton>
  );
};

export { GithubTooltip, GithubButton, GithubIconButton, GithubTextField, GithubHeaderButton };
