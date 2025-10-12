import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Typography } from "@mui/material";

import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { MappingCardNoItemDisplay } from "@/ui/configs/MappingCardNoItem";
import { MappingCardList, MappingCardListItem } from "@/ui/configs/MappingCardList";
import { CreateMappingPopover } from "@/ui/configs/MappingPopover";

import { centerTextSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

const StatChip = ({ color, text }: { color: string; text: string }) => {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: color, opacity: 0.2 }} />
      <Typography variant="body2" sx={{ position: "relative", textWrap: "nowrap", color, ...centerTextSx }}>
        {text}
      </Typography>
    </Box>
  );
};

const MappingCardHeader = () => {
  const mappings = useAdapter((state) => state.mappings);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const instance = useAdapter((state) => state.instance);
  const addDisabled = instance === null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <CardHeader>
      <Typography variant="subtitle1" component="h2">
        Mappings
      </Typography>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <StatChip color="text.secondary" text={`${mappings.length} total`} />

        <GithubTooltip title={addDisabled ? "Adapter is not running" : "Add a new mapping"}>
          <GithubButton size="small" disabled={addDisabled} onClick={handleOpen}>
            <AddRoundedIcon fontSize="small" sx={{ mx: 0.5 }} />
            <ExpandMoreRoundedIcon fontSize="small" />
          </GithubButton>
        </GithubTooltip>
      </Box>

      <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
    </CardHeader>
  );
};

const MappingCardBody = () => {
  const mappings = useAdapter((state) => state.mappings);

  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {mappings.length > 0 ? (
        <MappingCardList>
          {mappings.map(({ id, mapping, createdAt }) => (
            <MappingCardListItem key={id} id={id} content={mapping} createdAt={createdAt} />
          ))}
        </MappingCardList>
      ) : (
        <MappingCardNoItemDisplay />
      )}
    </Box>
  );
};

const MappingCard = () => (
  <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <MappingCardHeader />
    <MappingCardBody />
  </Card>
);

export { MappingCard };
