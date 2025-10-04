import { Box, Typography } from "@mui/material";
import { GithubButton, GithubTextField } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { useTabs } from "@/ui/tabs";

const CreateSessionCard = () => {
  const launch = useTabs((state) => state.launch);

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
          <GithubButton size="small" fullWidth color="inherit" onClick={() => launch(true)}>
            Create
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

const JoinSessionCard = () => {
  const launch = useTabs((state) => state.launch);

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
          <GithubButton size="small" fullWidth color="inherit" onClick={() => launch(true)}>
            Join
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

export { CreateSessionCard, JoinSessionCard };
