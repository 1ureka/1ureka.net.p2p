import { useState } from "react";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import { Box, Button, Typography } from "@mui/material";

import { buttonWithStartIconSx } from "./utils";
import { LogDrawer } from "./Drawer";

const Header = () => {
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 5,
        pb: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 3.5 }}>
        <Box sx={{ bgcolor: "primary.main", p: 1, borderRadius: 2 }}>
          <LanRoundedIcon fontSize="large" sx={{ display: "block", color: "text.primary" }} />
        </Box>

        <Typography variant="h6" component="h1">
          P2P 橋接工具
        </Typography>
      </Box>

      <Box>
        <Button startIcon={<NotesRoundedIcon />} sx={buttonWithStartIconSx} onClick={() => setOpen(true)}>
          測試工具
        </Button>
        <LogDrawer open={open} onClose={() => setOpen(false)} />
      </Box>
    </Box>
  );
};

export { Header };
