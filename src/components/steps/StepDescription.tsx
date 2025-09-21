import { Box, Typography } from "@mui/material";

const StepDescription = ({ title, description }: { title: string; description: string }) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
};

export { StepDescription };
