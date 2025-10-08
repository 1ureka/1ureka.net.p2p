import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import ReadMoreRoundedIcon from "@mui/icons-material/ReadMoreRounded";

import { Box, Divider, Typography } from "@mui/material";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton } from "@/ui/components/Github";
import { TrafficChart } from "@/ui/components/TrafficCardChart";

import { useTab } from "@/ui/tabs";
import { centerTextSx, generateColorMix } from "@/ui/theme";

const TrafficCardHeader = () => {
  const setTab = useTab((state) => state.setTab);

  return (
    <CardHeader>
      <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
        Metrics
      </Typography>

      <Box sx={{ flex: 1 }} />

      <GithubButton size="small" onClick={() => setTab("metrics")}>
        <Typography variant="body2" sx={centerTextSx}>
          Details
        </Typography>
        <ReadMoreRoundedIcon fontSize="small" />
      </GithubButton>
    </CardHeader>
  );
};

const TrafficCardSubHeader = ({ children }: { children: React.ReactNode }) => {
  const bgcolor = ({ palette }: { palette: { background: { paper: string; default: string } } }) =>
    generateColorMix(palette.background.paper, palette.background.default, 50);

  return <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 40, px: 2, bgcolor }}>{children}</Box>;
};

const TrafficCardBody = () => {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr" }}>
      <Box>
        <TrafficCardSubHeader>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
            Egress
          </Typography>
          <Box sx={{ color: "text.secondary" }}>
            <FileUploadRoundedIcon color="inherit" fontSize="small" sx={{ display: "block" }} />
          </Box>
        </TrafficCardSubHeader>

        <Divider />

        <TrafficChart direction="egress" />
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderWidth: 1, borderColor: "divider" }} />

      <Box>
        <TrafficCardSubHeader>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
            Ingress
          </Typography>
          <Box sx={{ color: "text.secondary" }}>
            <FileDownloadRoundedIcon color="inherit" fontSize="small" sx={{ display: "block" }} />
          </Box>
        </TrafficCardSubHeader>

        <Divider />

        <TrafficChart direction="ingress" />
      </Box>
    </Box>
  );
};

const TrafficCard = () => (
  <Card>
    <TrafficCardHeader />
    <TrafficCardBody />
  </Card>
);

export { TrafficCard };
