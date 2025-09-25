import { ellipsisSx } from "@/components-lib/Property";
import { type PaperProps, Paper } from "@mui/material";
import { type BoxProps, Box } from "@mui/material";
import { type ButtonProps, Button } from "@mui/material";
import { type TypographyProps, Typography } from "@mui/material";

const defaultLayoutSx = { display: "grid", gap: 0.5, minHeight: 0 } as const;

const LayoutColumn = ({ children, sx, ...props }: BoxProps) => {
  return (
    <Box {...props} sx={{ ...defaultLayoutSx, gridAutoFlow: "row", gridAutoRows: "min-content", ...sx }}>
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
      sx={{ position: "relative", p: 1.5, border: "2px solid", borderColor: "divider", minHeight: 0, ...sx }}
    >
      <LayoutColumn sx={{ height: 1 }}>{children}</LayoutColumn>
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
        "& b": { fontWeight: "bold", color: "text.primary" },
        ...ellipsisSx,
        WebkitLineClamp: 3,
        ...sx,
      }}
      {...props}
    />
  );
};

export { LayoutColumn, LayoutRow, LayoutBox, LayoutButton, LayoutTitle, LayoutText };
