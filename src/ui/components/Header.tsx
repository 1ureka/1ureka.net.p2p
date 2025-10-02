import DirectionsBoatRoundedIcon from "@mui/icons-material/DirectionsBoatRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { Box, BoxProps, Button, Divider, Tab, Tabs, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { useTabs } from "@/ui/tabs";

const HeaderTitle = () => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <DirectionsBoatRoundedIcon fontSize="large" color="primary" />
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography variant="h5" component="h1" sx={{ ...centerTextSx }}>
          1ureka.net.p2p
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", textWrap: "nowrap", ...centerTextSx }}>
          v1.0.0-alpha.5
        </Typography>
      </Box>
    </Box>
  );
};

const HeaderLinks = () => {
  return (
    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 2 }}>
      <Button color="inherit" sx={{ textTransform: "none", textWrap: "nowrap" }} startIcon={<HelpRoundedIcon />}>
        help & support
      </Button>
      <Button color="inherit" sx={{ textTransform: "none", textWrap: "nowrap" }} startIcon={<CodeRoundedIcon />}>
        source code
      </Button>
    </Box>
  );
};

const HeaderTabs = () => {
  const { tab, pages, setTab } = useTabs();

  return (
    <Tabs
      value={tab}
      onChange={(_, v) => setTab(v)}
      slotProps={{ indicator: { children: <span className="MuiTabs-indicatorSpan" /> } }}
      sx={{
        "& .MuiTabs-indicator": { display: "flex", justifyContent: "center", bgcolor: "transparent" },
        "& .MuiTabs-indicatorSpan": { maxWidth: 40, width: 1, bgcolor: "primary.main" },
        "& .MuiTab-root": { textTransform: "none", "&:not(.Mui-selected):hover": { color: "text.primary" } },
      }}
    >
      {pages.map(({ label, value, disabled }) => (
        <Tab key={value} label={label} value={value} disabled={disabled} />
      ))}
    </Tabs>
  );
};

const headerSx: BoxProps["sx"] = {
  px: 4,
  pt: 2,
  bgcolor: "background.paper",
  position: "sticky",
  top: 0,
  zIndex: 1,
  minWidth: "fit-content",
};

const Header = () => {
  return (
    <Box sx={headerSx}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <HeaderTitle />
        <HeaderLinks />
      </Box>
      <Divider sx={{ my: 2, borderWidth: 1.5 }} />
      <HeaderTabs />
    </Box>
  );
};

export { Header };
