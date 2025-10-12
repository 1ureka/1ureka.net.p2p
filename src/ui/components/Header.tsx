import NatRoundedIcon from "@mui/icons-material/NatRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import DeveloperModeRoundedIcon from "@mui/icons-material/DeveloperModeRounded";

import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { useState } from "react";
import { UrlDialog } from "@/ui/components/UrlDialog";
import { GithubTooltip } from "@/ui/components/Github";
import { IPCChannel } from "@/ipc";

const HeaderTitle = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <NatRoundedIcon fontSize="large" color="primary" />
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography variant="h5" component="h1" sx={centerTextSx}>
          1ureka.net.p2p
        </Typography>
        <Typography
          variant="body2"
          sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", textAlign: "right", ...centerTextSx }}
        >
          v1.0.0-alpha.9
        </Typography>
      </Box>
    </Box>
  );
};

const HeaderLinks = () => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const helpUrl = "https://github.com/1ureka/1ureka.net.p2p?tab=readme-ov-file#1urekanetp2p";

  return (
    <>
      <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
        {isSm ? (
          <Button
            color="inherit"
            sx={{ textTransform: "none", textWrap: "nowrap" }}
            startIcon={<HelpRoundedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            help & support
          </Button>
        ) : (
          <GithubTooltip title="Help & support">
            <Button color="inherit" sx={{ minWidth: 0 }} onClick={() => setDialogOpen(true)}>
              <HelpRoundedIcon fontSize="small" />
            </Button>
          </GithubTooltip>
        )}

        <GithubTooltip title="Open developer tools">
          <Button color="inherit" sx={{ minWidth: 0 }} onClick={() => window.electron.send(IPCChannel.DeveloperTools)}>
            <DeveloperModeRoundedIcon fontSize="small" />
          </Button>
        </GithubTooltip>
      </Box>
      <UrlDialog open={dialogOpen} url={helpUrl} onClose={() => setDialogOpen(false)} />
    </>
  );
};

const Header = () => {
  return (
    <Box sx={{ px: 4, bgcolor: "background.header", borderBottom: "2px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "space-between", height: 64 }}>
        <HeaderTitle />
        <HeaderLinks />
      </Box>
    </Box>
  );
};

export { Header };
