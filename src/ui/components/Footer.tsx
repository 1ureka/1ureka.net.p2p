import DeveloperModeRoundedIcon from "@mui/icons-material/DeveloperModeRounded";
import { Box, Typography } from "@mui/material";
import { GithubButton } from "@/ui/components/Github";
import { centerTextSx } from "@/ui/theme";
import { IPCChannel } from "@/ipc";

const Footer = () => {
  return (
    <Box
      sx={{
        borderTop: "2px solid",
        borderColor: "divider",
        px: 2,
        height: 48,
        bgcolor: "background.paper",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <GithubButton
        sx={{ py: 0.5, px: 1.5, ...centerTextSx }}
        onClick={() => window.electron.send(IPCChannel.DeveloperTools)}
        startIcon={<DeveloperModeRoundedIcon />}
      >
        Open developer tools
      </GithubButton>

      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "right", ...centerTextSx }}>
        v1.0.0-alpha.9
      </Typography>
    </Box>
  );
};

export { Footer };
