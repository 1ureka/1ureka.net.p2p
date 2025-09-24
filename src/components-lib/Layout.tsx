import { ellipsisSx } from "@/components/utils";
import { type PaperProps, Paper } from "@mui/material";
import { type BoxProps, Box } from "@mui/material";
import { type ButtonProps, Button } from "@mui/material";
import { type TypographyProps, Typography } from "@mui/material";

const defaultLayoutSx = { display: "grid", gap: 0.5 } as const;

const LayoutColumn = ({ children, sx, ...props }: BoxProps) => {
  return (
    <Box {...props} sx={{ ...defaultLayoutSx, gridAutoFlow: "row", ...sx }}>
      {children}
    </Box>
  );
};

const LayoutRow = ({ children, sx, ...props }: BoxProps) => {
  return (
    <Box {...props} sx={{ ...defaultLayoutSx, gridAutoFlow: "column", gridAutoColumns: "1fr", ...sx }}>
      {children}
    </Box>
  );
};

const LayoutBox = ({ children, sx, ...props }: PaperProps) => {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{ position: "relative", p: 1.5, border: "2px solid", borderColor: "divider", ...sx }}
    >
      <LayoutColumn>{children}</LayoutColumn>
    </Paper>
  );
};

const LayoutButton = ({ sx, ...props }: ButtonProps) => {
  return (
    <Button
      variant="contained"
      disableElevation
      fullWidth
      sx={{ "&:hover": { bgcolor: "primary.light" }, p: 1, my: 1, ...sx }}
      {...props}
    />
  );
};

const LayoutTitle = ({ sx, ...props }: TypographyProps) => {
  return (
    <Typography
      variant="body1"
      component="h2"
      sx={{
        color: "text.primary",
        ...ellipsisSx,
        ...sx,
      }}
      {...props}
    />
  );
};

const LayoutText = ({ sx, ...props }: TypographyProps) => {
  return (
    <Typography
      variant="body2"
      component="p"
      sx={{
        color: "text.secondary",
        ...ellipsisSx,
        WebkitLineClamp: 2,
        ...sx,
      }}
      {...props}
    />
  );
};

export { LayoutColumn, LayoutRow, LayoutBox, LayoutButton, LayoutTitle, LayoutText };
