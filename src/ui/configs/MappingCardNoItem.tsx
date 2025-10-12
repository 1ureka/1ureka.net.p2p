import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography } from "@mui/material";

const title = "No mappings yet";
const description = "You haven't added any mappings yet. Create one to connect to peer services.";

const MappingCardNoItemDisplay = () => (
  <Box sx={{ height: 1, display: "grid", placeItems: "center" }}>
    <Box sx={{ p: 2, color: "text.secondary", display: "grid", placeItems: "center" }}>
      <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

      <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
        {description}
      </Typography>
    </Box>
  </Box>
);

export { MappingCardNoItemDisplay };
