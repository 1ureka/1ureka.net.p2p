import { Box, Typography } from "@mui/material";
import { memo, useState } from "react";
import { CreateSessionCard, JoinSessionCard } from "@/ui/launch/LaunchCard";
import { UrlDialog } from "@/ui/components/UrlDialog";

const LaunchPage = memo(() => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const usageGuideUrl = "https://github.com/1ureka/1ureka.net.p2p?tab=readme-ov-file#1urekanetp2p";

  return (
    <>
      <Box sx={{ display: "grid", placeItems: "center", gridTemplateRows: "1fr auto 1fr", flex: 1, gap: 5, py: 3 }}>
        <Box sx={{ textAlign: "center", alignSelf: "end" }}>
          <Typography variant="subtitle1" component="h1">
            Share TCP Services Over P2P
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 600 }}>
            Share local TCP services directly with peers without port forwarding, fixed IPs, or relay servers.
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
              onClick={() => setDialogOpen(true)}
            >
              usage guide
            </Typography>
          </Typography>
        </Box>
      </Box>
      <UrlDialog open={dialogOpen} url={usageGuideUrl} onClose={() => setDialogOpen(false)} />
    </>
  );
});

LaunchPage.displayName = "LaunchPage";

export { LaunchPage };
