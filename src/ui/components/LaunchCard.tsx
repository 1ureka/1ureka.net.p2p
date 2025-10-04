import { styled } from "@mui/material/styles";
import { Box, Button, Typography, TextField } from "@mui/material";
import { Card, CardHeader } from "@/ui/components/Card";

const GithubTextField = styled(TextField)(({ theme }) => ({
  "& .MuiFormLabel-root": { fontSize: "0.85rem" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    backgroundColor: theme.palette.background.paper,
    fontSize: "0.85rem",
    "& fieldset": { borderWidth: 2, fontSize: "0.85rem", borderColor: theme.palette.divider },
    "&:hover fieldset": { borderColor: theme.palette.text.disabled },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& input::placeholder": { color: "#6e7781", opacity: 1 },
  },
}));

const GithubButton = styled(Button)(({ theme }) => ({
  borderRadius: 6,
  color: theme.palette.text.primary,
  textTransform: "none",
  textWrap: "nowrap",
  border: "2px solid",
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  "&:hover": { filter: "brightness(1.2)" },
  fontWeight: "bold",
}));

const CreateSessionCard = () => {
  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
          <Typography variant="subtitle1" component="h2">
            Create Session
          </Typography>
          <Typography variant="subtitle2" component="h3" sx={{ color: "text.secondary" }}>
            as host
          </Typography>
        </Box>
      </CardHeader>

      <Box sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Share local TCP services with others. A unique Session ID will be generated for Clients to join.
        </Typography>

        <Box sx={{ my: 1.5 }}>
          <GithubButton size="small" fullWidth color="inherit">
            Create
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

const JoinSessionCard = () => {
  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
          <Typography variant="subtitle1" component="h2">
            Join Session
          </Typography>
          <Typography variant="subtitle2" component="h3" sx={{ color: "text.secondary" }}>
            as client
          </Typography>
        </Box>
      </CardHeader>

      <Box sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Connect to services shared by the Host using the Session ID.
        </Typography>

        <Box sx={{ my: 1.5, display: "flex", gap: 1, flexDirection: "column" }}>
          <GithubTextField fullWidth size="small" label="Session ID" placeholder="Enter Session ID" />
          <GithubButton size="small" fullWidth color="inherit">
            Join
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

export { CreateSessionCard, JoinSessionCard };
