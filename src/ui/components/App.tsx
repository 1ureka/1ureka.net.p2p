import DirectionsBoatRoundedIcon from "@mui/icons-material/DirectionsBoatRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import { Box, BoxProps, Button, Divider, Tab, Tabs, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";

import { useTabs } from "@/ui/tabs";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { EventsCard } from "@/ui/components/EventsCard";
import { SessionCard } from "@/ui/components/SessionCard";

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

// ------------------------------------------------------------

function formatElapsed(elapsed: number) {
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  // padStart(2, '0') 讓數字補成兩位數
  return [String(hours).padStart(2, "0"), String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].join(":");
}

const MappingCardListItem = ({ index, content, elapsed }: { index: number; content: string; elapsed: number }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridAutoRows: "auto",
        gap: 0.5,
        "& div:nth-of-type(2n)": { justifySelf: "end" },
        py: 1.5,
        px: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
        <SignpostRoundedIcon color="inherit" fontSize="small" />
        <Typography variant="body2">mapping #{index}</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button sx={{ minWidth: 0, p: 0.5 }} color="warning">
          <StopRoundedIcon fontSize="small" />
        </Button>
        <Button sx={{ minWidth: 0, p: 0.5 }} color="error">
          <DeleteForeverRoundedIcon fontSize="small" />
        </Button>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ ...ellipsisSx, fontFamily: "Ubuntu" }}>
          {content}
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", pr: 1, ...ellipsisSx }}>
          {formatElapsed(elapsed)}
        </Typography>
      </Box>
    </Box>
  );
};

const MappingCardList = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", "& > div:nth-of-type(2n)": { bgcolor: "divider" } }}>
      {children}
    </Box>
  );
};

const MappingCard = () => {
  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button sx={{ py: 0.5, px: 1 }} startIcon={<AddBoxRoundedIcon />}>
          <Typography variant="body2" sx={{ textTransform: "none", textWrap: "nowrap", ...centerTextSx }}>
            Add
          </Typography>
        </Button>
      </CardHeader>

      <MappingCardList>
        <MappingCardListItem index={1} content={"0.0.0.0.0.0:52234 <=> 0.0.0.0.0.0:52235"} elapsed={12345} />
        <MappingCardListItem index={2} content={"0.0.0.0.0.0:3000 <=> 0.0.0.0.0.0:3000"} elapsed={1255} />
        <MappingCardListItem index={3} content={"0.0.0.0.0.0:4000 <=> 0.0.0.0.0.0:4000"} elapsed={6789} />
        <MappingCardListItem index={4} content={"0.0.0.0.0.0:5000 <=> 192.168.1.1:5000"} elapsed={9876} />
      </MappingCardList>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

// ------------------------------------------------------------

const App = () => {
  return (
    <Box
      sx={{ height: "100dvh", overflow: "auto" }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Header />
      <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", alignItems: "start", gap: 2, px: 4, py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SessionCard />
          <MappingCard />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 2 }}></Box>
          <EventsCard />
        </Box>
      </Box>
    </Box>
  );
};

export { App };
