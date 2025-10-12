import NatRoundedIcon from "@mui/icons-material/NatRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import { Box, Button, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { useState } from "react";
import { UrlDialog } from "@/ui/components/UrlDialog";

const HeaderTitle = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <NatRoundedIcon fontSize="large" color="primary" />
      <Typography variant="h5" component="h1" sx={centerTextSx}>
        1ureka.net.p2p
      </Typography>
    </Box>
  );
};

const HeaderLinks = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const helpUrl = "https://github.com/1ureka/1ureka.net.p2p?tab=readme-ov-file#1urekanetp2p";

  return (
    <>
      <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          color="inherit"
          sx={{ textTransform: "none", textWrap: "nowrap" }}
          startIcon={<HelpRoundedIcon />}
          onClick={() => setDialogOpen(true)}
        >
          help & support
        </Button>
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
