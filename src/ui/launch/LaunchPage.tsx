import { Box, Typography } from "@mui/material";
import { memo } from "react";
import { CreateSessionCard, JoinSessionCard } from "@/ui/launch/LaunchCard";
import { IPCChannel } from "@/ipc";

const LaunchPage = memo(() => (
  <Box sx={{ display: "grid", placeItems: "center", gridTemplateRows: "1fr auto 1fr", flex: 1, gap: 5, py: 3 }}>
    <Box sx={{ textAlign: "center", alignSelf: "end" }}>
      <Typography variant="subtitle1" component="h1">
        Share TCP Services Over P2P
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 600 }}>
        Connect directly with others without port forwarding, fixed IPs, or proxy services. Choose your role to get
        started.
      </Typography>
    </Box>

    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start", width: 750, gap: 2 }}>
      <CreateSessionCard />
      <JoinSessionCard />
    </Box>

    <Box sx={{ textAlign: "center", alignSelf: "start" }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Not sure which option to choose?
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {"Check out the documentation for guidance: "}
        <Typography
          variant="body2"
          component="a"
          href="#"
          sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          onClick={() => {
            window.electron.request(
              IPCChannel.OpenExternalLink,
              "https://github.com/1ureka/1ureka.net.p2p?tab=readme-ov-file#1urekanetp2p"
            );
          }}
        >
          usage guide
        </Typography>
      </Typography>
    </Box>
  </Box>
));

LaunchPage.displayName = "LaunchPage";

export { LaunchPage };
