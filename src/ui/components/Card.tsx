import { Box, Divider, type BoxProps } from "@mui/material";
import { generateColorMix } from "@/ui/theme";

const Card = ({ children, sx }: { children: React.ReactNode; sx?: BoxProps["sx"] }) => {
  return (
    <Box sx={{ borderRadius: 1.5, border: "2px solid", borderColor: "divider", overflow: "hidden", ...sx }}>
      {children}
    </Box>
  );
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Box
        sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", gap: 2, pl: 2, pr: 1, height: 40 }}
      >
        {children}
      </Box>
      <Divider />
    </>
  );
};

const CardSubHeader = ({ children, sx }: { children: React.ReactNode; sx?: BoxProps["sx"] }) => {
  const bgcolor = ({ palette }: { palette: { background: { paper: string; default: string } } }) =>
    generateColorMix(palette.background.paper, palette.background.default, 50);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40, pl: 2, pr: 1, bgcolor, ...sx }}>
        {children}
      </Box>
      <Divider />
    </>
  );
};

export { Card, CardHeader, CardSubHeader };
