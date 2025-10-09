import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Typography } from "@mui/material";

import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { ConfigsCardBody } from "@/ui/configs/ConfigsCardShared";
import { CreateMappingPopover } from "@/ui/configs/ConfigsPopover";

import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

const MappingCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const mappings = useAdapter((state) => state.mappings);
  const instance = useAdapter((state) => state.instance);
  const addDisabled = instance === null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flex: 1 }} />

        <GithubTooltip title={addDisabled ? "Start adapter first" : "Add a new mapping"}>
          <GithubButton size="small" disabled={addDisabled} onClick={handleOpen}>
            <AddRoundedIcon fontSize="small" sx={{ mx: 0.5 }} />
            <ExpandMoreRoundedIcon fontSize="small" />
          </GithubButton>
        </GithubTooltip>
      </CardHeader>

      <ConfigsCardBody items={mappings.map(({ id, mapping, createdAt }) => ({ id, content: mapping, createdAt }))} />

      <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
    </Card>
  );
};

export { MappingCard };
