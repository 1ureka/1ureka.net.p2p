import { Box, Typography } from "@mui/material";
import { GithubButton, GithubTextField } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";
import { centerTextSx } from "@/ui/theme";

import { z } from "zod";
import { useState } from "react";
import { useSession } from "@/transport-state/store";
import { handleCreateSession, handleJoinSession } from "@/transport-state/handlers";

const CreateSessionCard = () => {
  const status = useSession((state) => state.status);
  const disabled = status !== "disconnected";
  const loading = status === "joining";

  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
          <Typography variant="subtitle1" component="h2" sx={{ ...centerTextSx }}>
            Create Session
          </Typography>
          <Typography variant="subtitle2" component="h3" sx={{ color: "text.secondary", ...centerTextSx }}>
            as host
          </Typography>
        </Box>
      </CardHeader>

      <Box sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Share local TCP services with a Client. A unique Session ID will be generated for Clients to join.
        </Typography>

        <Box sx={{ my: 1.5 }}>
          <GithubButton
            size="small"
            fullWidth
            color="inherit"
            disabled={disabled}
            loading={loading}
            loadingPosition="start"
            onClick={() => handleCreateSession()}
          >
            Create
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

const nanoidSchema = z.string().regex(/^[A-Za-z0-9_-]{21}$/, {
  message: "Invalid Session ID format",
});

const JoinSessionCard = () => {
  const status = useSession((state) => state.status);
  const disabled = status !== "disconnected";
  const loading = status === "joining";

  const [id, setId] = useState("");
  const [error, setError] = useState("");

  const handleFocus = () => {
    setError("");
  };

  const handleJoin = () => {
    const result = nanoidSchema.safeParse(id.trim());
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    handleJoinSession(id.trim());
  };

  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
          <Typography variant="subtitle1" component="h2" sx={{ ...centerTextSx }}>
            Join Session
          </Typography>
          <Typography variant="subtitle2" component="h3" sx={{ color: "text.secondary", ...centerTextSx }}>
            as client
          </Typography>
        </Box>
      </CardHeader>

      <Box sx={{ px: 3, py: 1.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Connect to services shared by the Host using the Session ID.
        </Typography>

        <Box sx={{ my: 1.5, display: "flex", gap: 1, flexDirection: "column" }}>
          <GithubTextField
            fullWidth
            size="small"
            label="Session ID"
            placeholder="Enter Session ID"
            onFocus={handleFocus}
            value={id}
            onChange={(e) => setId(e.target.value)}
            error={Boolean(error)}
            helperText={error}
          />
          <GithubButton
            size="small"
            fullWidth
            color="inherit"
            disabled={disabled}
            loading={loading}
            loadingPosition="start"
            onClick={handleJoin}
          >
            Join
          </GithubButton>
        </Box>
      </Box>
    </Card>
  );
};

export { CreateSessionCard, JoinSessionCard };
