import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography } from "@mui/material";
import { useAdapter } from "@/adapter-state/store";

const displayMap = {
  stopped: {
    title: "Adapter not started",
    description: "Start the adapter first to create port mappings and connect local and remote ports.",
  },
  empty: {
    title: "No mappings yet",
    description: "You haven't added any port mappings yet. Create one to connect local and remote ports.",
  },
};

const ConfigsCardNoItemDisplay = () => {
  const instance = useAdapter((state) => state.instance);
  const { title, description } = displayMap[instance === null ? "stopped" : "empty"];

  return (
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
};

export { ConfigsCardNoItemDisplay };
