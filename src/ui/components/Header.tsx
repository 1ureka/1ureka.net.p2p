import DirectionsBoatRoundedIcon from "@mui/icons-material/DirectionsBoatRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import { Box, BoxProps, Button, Tab, Tabs, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { useTab, type TabEntry } from "@/ui/tabs";
import { useSession } from "@/transport-state/store";
import { IPCChannel } from "@/ipc";

const HeaderTitle = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <DirectionsBoatRoundedIcon fontSize="large" color="primary" />
      <Typography variant="h5" component="h1" sx={centerTextSx}>
        1ureka.net.p2p
      </Typography>
    </Box>
  );
};

const HeaderLinks = () => {
  const handleClick = () => {
    window.electron.request(
      IPCChannel.OpenExternalLink,
      "https://github.com/1ureka/1ureka.net.p2p?tab=readme-ov-file#1urekanetp2p"
    );
  };

  return (
    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 2 }}>
      <Button
        color="inherit"
        sx={{ textTransform: "none", textWrap: "nowrap" }}
        startIcon={<HelpRoundedIcon />}
        onClick={handleClick}
      >
        help & support
      </Button>
    </Box>
  );
};

const HeaderTabs = () => {
  const status = useSession((state) => state.status);
  const { tab, setTab } = useTab();

  const tabs: TabEntry[] = [
    { label: "Overview", value: "overview", disabled: false },
    { label: "Events", value: "events", disabled: ["disconnected", "joining"].includes(status) },
    { label: "Metrics", value: "metrics", disabled: ["disconnected", "joining"].includes(status) },
  ];

  return (
    <Tabs
      value={tab}
      onChange={(_, v) => setTab(v)}
      slotProps={{ indicator: { children: <span className="MuiTabs-indicatorSpan" /> } }}
      sx={{
        mt: 2.5,
        "& .MuiTabs-indicator": { display: "flex", justifyContent: "center", bgcolor: "transparent" },
        "& .MuiTabs-indicatorSpan": { maxWidth: 40, width: 1, bgcolor: "primary.main" },
        "& .MuiTab-root": { textTransform: "none", "&:not(.Mui-selected):hover": { color: "text.primary" } },
      }}
    >
      {tabs.map(({ label, value, disabled }) => (
        <Tab key={value} label={label} value={value} disabled={disabled} />
      ))}
    </Tabs>
  );
};

const headerInnerSx: BoxProps["sx"] = {
  display: "grid",
  alignItems: "center",
  gap: 3,
  gridTemplateColumns: "minmax(min-content, 1fr) minmax(min-content, auto) minmax(min-content, 1fr)",
  "& > div:nth-of-type(1)": { justifySelf: "start" },
  "& > div:nth-of-type(2)": { justifySelf: "center" },
  "& > div:nth-of-type(3)": { justifySelf: "end" },
};

const Header = () => {
  return (
    <Box sx={{ px: 4, bgcolor: "background.header", borderBottom: "2px solid", borderColor: "divider" }}>
      <Box sx={headerInnerSx}>
        <HeaderTitle />
        <HeaderTabs />
        <HeaderLinks />
      </Box>
    </Box>
  );
};

export { Header };
