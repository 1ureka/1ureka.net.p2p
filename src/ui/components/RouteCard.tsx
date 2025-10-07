import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";

import { Box, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubHeaderButton, GithubTooltip } from "@/ui/components/Github";
import { RouteCardList, RouteCardListItem } from "@/ui/components/RouteCardList";
import { CreateMappingPopover, CreateRulePopover } from "@/ui/components/RouteCardDialog";

import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

type NoItemDisplayProps = {
  type: "mapping" | "rule";
  actionDisabled?: boolean;
  onAction?: (event: React.MouseEvent<HTMLElement>) => void;
};

const NoItemDisplay = ({ type, actionDisabled, onAction }: NoItemDisplayProps) => {
  const title = type === "mapping" ? "No mappings yet" : "No rules defined";
  const description =
    type === "mapping"
      ? "You haven’t added any port mappings yet. Create one to connect local and remote ports."
      : "You haven’t defined any access rules yet. Add one to allow incoming connections.";

  return (
    <Box sx={{ height: 1, display: "grid", placeItems: "center" }}>
      <Box sx={{ p: 2, color: "text.secondary", display: "grid", placeItems: "center" }}>
        <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

        <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
          {description}
        </Typography>

        <GithubButton
          sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
          startIcon={<AddBoxRoundedIcon />}
          disabled={actionDisabled}
          onClick={onAction}
        >
          <Typography variant="body2">Add</Typography>
        </GithubButton>
      </Box>
    </Box>
  );
};

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
          <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={addDisabled} onClick={handleOpen}>
            Add
          </GithubHeaderButton>
        </GithubTooltip>
        <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
      </CardHeader>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {mappings.length <= 0 && <NoItemDisplay type="mapping" actionDisabled={addDisabled} onAction={handleOpen} />}
        {mappings.length > 0 && (
          <RouteCardList>
            {mappings.map(({ id, mapping, createdAt }) => (
              <RouteCardListItem key={id} id={id} type="mapping" content={mapping} createdAt={createdAt} />
            ))}
          </RouteCardList>
        )}
      </Box>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

const RuleCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const rules = useAdapter((state) => state.rules);
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
          Rules
        </Typography>

        <Box sx={{ flex: 1 }} />

        <GithubTooltip title={addDisabled ? "Start adapter first" : "Add a new rule"}>
          <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={addDisabled} onClick={handleOpen}>
            add
          </GithubHeaderButton>
        </GithubTooltip>
        <CreateRulePopover anchorEl={anchorEl} onClose={handleClose} />
      </CardHeader>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {rules.length <= 0 && <NoItemDisplay type="rule" actionDisabled={addDisabled} onAction={handleOpen} />}
        {rules.length > 0 && (
          <RouteCardList>
            {rules.map(({ id, pattern, createdAt }) => (
              <RouteCardListItem key={id} id={id} type="rule" content={pattern} createdAt={createdAt} />
            ))}
          </RouteCardList>
        )}
      </Box>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { MappingCard, RuleCard };
