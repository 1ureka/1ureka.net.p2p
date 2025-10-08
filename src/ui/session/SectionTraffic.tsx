import ReadMoreRoundedIcon from "@mui/icons-material/ReadMoreRounded";
import { Box, Typography } from "@mui/material";

import { useTab } from "@/ui/tabs";
import { centerTextSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { SessionCardSubHeader } from "@/ui/session/SessionCard";
import { SessionCardChart } from "@/ui/session/SessionCardChart";

const TrafficHeader = () => {
  const setTab = useTab((state) => state.setTab);

  return (
    <SessionCardSubHeader>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", ...centerTextSx }}>
        Traffic
      </Typography>

      <GithubButton size="small" onClick={() => setTab("metrics")}>
        <Typography variant="body2" sx={centerTextSx}>
          Details
        </Typography>
        <ReadMoreRoundedIcon fontSize="small" />
      </GithubButton>
    </SessionCardSubHeader>
  );
};

const TrafficBody = () => {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mb: -2 }}>
      <SessionCardChart />
    </Box>
  );
};

export { TrafficHeader, TrafficBody };
