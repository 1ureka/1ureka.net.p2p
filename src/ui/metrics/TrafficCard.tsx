import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";

import { Box, Divider, Typography } from "@mui/material";
import { centerTextSx, generateColorMix } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { TrafficChart } from "@/ui/metrics/TrafficCardChart";

const TrafficCardSubHeader = ({ children }: { children: React.ReactNode }) => {
  const bgcolor = ({ palette }: { palette: { background: { paper: string; default: string } } }) =>
    generateColorMix(palette.background.paper, palette.background.default, 50);

  return <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40, px: 2, bgcolor }}>{children}</Box>;
};

const TrafficCardBody = () => {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", minHeight: 0, flex: 1, overflow: "auto" }}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TrafficCardSubHeader>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
            Egress
          </Typography>
          <Box sx={{ color: "text.secondary" }}>
            <FileUploadRoundedIcon color="inherit" fontSize="small" sx={{ display: "block" }} />
          </Box>
        </TrafficCardSubHeader>

        <Divider />

        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <TrafficChart direction="egress" />
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ borderWidth: 1, borderColor: "divider" }} />

      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TrafficCardSubHeader>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
            Ingress
          </Typography>
          <Box sx={{ color: "text.secondary" }}>
            <FileDownloadRoundedIcon color="inherit" fontSize="small" sx={{ display: "block" }} />
          </Box>
        </TrafficCardSubHeader>

        <Divider />

        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <TrafficChart direction="ingress" />
        </Box>
      </Box>
    </Box>
  );
};

const TrafficCard = () => (
  <Card sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
    <CardHeader>
      <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
        Metrics
      </Typography>
    </CardHeader>

    <TrafficCardBody />
  </Card>
);

export { TrafficCard };
