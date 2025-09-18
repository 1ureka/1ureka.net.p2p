import { Box } from "@mui/material";

const Background = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: (theme) => `radial-gradient(circle, ${theme.palette.divider} 10%, transparent 11%)`,
        backgroundSize: "60px 60px",
        backgroundPosition: "center",
        pointerEvents: "none",
      }}
    />
  );
};

export { Background };
