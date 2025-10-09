import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { styled } from "@mui/material/styles";
import { Box, Button, TextField, Tooltip, tooltipClasses, Typography } from "@mui/material";
import { FormControlLabel, Switch } from "@mui/material";
import type { BoxProps, TooltipProps, FormControlLabelProps } from "@mui/material";
import { centerTextSx, generateColorMix } from "@/ui/theme";

const tooltipMargin = "5px";
const tooltipPopoverSx = {
  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {
    marginTop: tooltipMargin,
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: {
    marginBottom: tooltipMargin,
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]: {
    marginLeft: tooltipMargin,
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]: {
    marginRight: tooltipMargin,
  },
} as const;

const GithubTooltip = ({ slotProps, children, boxProps, ...props }: TooltipProps & { boxProps?: BoxProps }) => (
  <Tooltip
    enterDelay={0}
    slotProps={{
      popper: { sx: tooltipPopoverSx },
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
    "&.Mui-disabled fieldset": { borderColor: theme.palette.divider },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& input::placeholder": { color: "#6e7781", opacity: 1 },
  },
}));

const GithubButton = styled(Button)(({ theme, color, disabled }) => {
  const restStyle = {
    color: theme.palette.text.primary,
    outlineColor: theme.palette.divider,
    backgroundColor: theme.palette.background.paper,
  };
  const errorStyle = {
    color: theme.palette.error.main,
    outlineColor: generateColorMix(theme.palette.error.main, theme.palette.divider, 50),
    backgroundColor: generateColorMix(theme.palette.error.main, theme.palette.background.paper, 10),
  };
  const warningStyle = {
    color: theme.palette.warning.main,
    outlineColor: generateColorMix(theme.palette.warning.main, theme.palette.divider, 50),
    backgroundColor: generateColorMix(theme.palette.warning.main, theme.palette.background.paper, 10),
  };
  const primaryStyle = {
    color: theme.palette.primary.main,
    outlineColor: generateColorMix(theme.palette.primary.main, theme.palette.divider, 50),
    backgroundColor: generateColorMix(theme.palette.primary.main, theme.palette.background.paper, 10),
  };

  let themeStyle = restStyle;
  if (color === "error") themeStyle = errorStyle;
  else if (color === "warning") themeStyle = warningStyle;
  else if (color === "primary") themeStyle = primaryStyle;
  if (disabled) themeStyle = restStyle;

  return {
    minWidth: "fit-content",
    borderRadius: 6,
    color: themeStyle.color,
    textTransform: "none",
    textWrap: "nowrap",
    border: "none",
    outline: "2px solid",
    outlineColor: themeStyle.outlineColor,
    backgroundColor: themeStyle.backgroundColor,
    "&:hover": { filter: "brightness(1.2)" },
    fontWeight: "bold",
    gap: theme.spacing(0.5),
  };
});

const GithubIconButton = styled(GithubButton)(({ theme }) => ({
  padding: theme.spacing(0.3),
}));

const GithubSwitchBase = styled(Switch)(({ theme }) => ({
  width: 46,
  height: 23,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    "&:hover": { backgroundColor: "transparent" },
    width: 23,
    height: 23,
    padding: 2,
    transform: "translateX(0px)",
    "& + .MuiSwitch-track": {
      borderRadius: 6,
      backgroundColor: theme.palette.action.disabled,
    },
    "& > .MuiSwitch-thumb": {
      borderRadius: 6,
      width: "100%",
      height: "100%",
      boxShadow: "none",
      backgroundColor: theme.palette.background.header,
    },
    "&.Mui-checked": {
      transform: "translateX(23px)",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.primary.dark,
      },
      "& > .MuiSwitch-thumb": {
        backgroundColor: theme.palette.text.primary,
      },
    },
  },
}));

const switchIconSx: BoxProps["sx"] = {
  display: "block",
  fontSize: "16px",
  transition: "all 0.2s",
};

type GithubSwitchProps = Omit<FormControlLabelProps, "control" | "label" | "checked" | "onChange"> & {
  checked: boolean;
  onChange: () => void;
};

const GithubSwitch = ({ sx, disabled, checked, onChange, ...props }: GithubSwitchProps) => (
  <Box sx={{ position: "relative", opacity: disabled ? 0.5 : 1 }}>
    <FormControlLabel
      {...props}
      disabled={disabled}
      sx={{ m: 0, ...sx }}
      control={<GithubSwitchBase disableRipple checked={checked} onChange={onChange} />}
      labelPlacement="start"
      label={
        <Typography variant="caption" sx={{ ...centerTextSx, mr: 1 }}>
          {checked ? "On" : "Off"}
        </Typography>
      }
    />
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        left: "auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        pointerEvents: "none",
        width: 46,
        height: 23,
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center" }}>
        <HorizontalRuleRoundedIcon
          sx={{ ...switchIconSx, rotate: "90deg", scale: checked ? "1" : "0.5", opacity: checked ? 1 : 0 }}
        />
      </Box>
      <Box sx={{ display: "grid", placeItems: "center" }}>
        <RadioButtonUncheckedRoundedIcon
          sx={{ ...switchIconSx, color: "text.secondary", scale: checked ? "0.5" : "0.8", opacity: checked ? 0 : 1 }}
        />
      </Box>
    </Box>
  </Box>
);

export { GithubTooltip, GithubButton, GithubIconButton, GithubTextField, GithubSwitch };
