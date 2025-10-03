import { Box, Divider } from "@mui/material";

const Card = ({ children }: { children: React.ReactNode }) => {
  return <Box sx={{ borderRadius: 1.5, border: "2px solid", borderColor: "divider" }}>{children}</Box>;
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", gap: 2, p: 1.5, px: 3 }}>
        {children}
      </Box>
      <Divider sx={{ borderWidth: 1 }} />
    </>
  );
};

export { Card, CardHeader };
