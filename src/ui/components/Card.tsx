import { Box, Divider } from "@mui/material";

const Card = ({ children }: { children: React.ReactNode }) => {
  return <Box sx={{ bgcolor: "background.paper", borderRadius: 2 }}>{children}</Box>;
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, px: 3 }}>{children}</Box>
      <Divider sx={{ borderWidth: 1.5, mx: 1 }} />
    </>
  );
};

export { Card, CardHeader };
