import { Box, Divider, type BoxProps } from "@mui/material";

const Card = ({ children, sx }: { children: React.ReactNode; sx?: BoxProps["sx"] }) => {
  return <Box sx={{ borderRadius: 1.5, border: "2px solid", borderColor: "divider", ...sx }}>{children}</Box>;
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", gap: 2, px: 3, height: 40 }}>
        {children}
      </Box>
      <Divider sx={{ borderWidth: 1 }} />
    </>
  );
};

export { Card, CardHeader };
