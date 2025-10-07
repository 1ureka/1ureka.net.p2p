import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";

import { Box, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { RouteCardList, RouteCardListItem } from "@/ui/components/RouteCardList";
import { CreateMappingPopover, CreateRulePopover } from "@/ui/components/RouteCardDialog";

import { useAdapter } from "@/adapter-state/store";
import { useState, memo } from "react";
import { useSession } from "@/transport-state/store";

type RouteCardProps = {
  type: "mapping" | "rule";
  actionDisabled?: boolean;
  onAction?: (event: React.MouseEvent<HTMLElement>) => void;
};

const RouteCardNoItemDisplay = ({ type, actionDisabled, onAction }: RouteCardProps) => {
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

        <GithubButton sx={{ mt: 2, px: 1.5 }} disabled={actionDisabled} onClick={onAction}>
          <AddBoxRoundedIcon fontSize="small" />
          <Typography variant="body2" sx={centerTextSx}>
            Add
          </Typography>
        </GithubButton>
      </Box>
    </Box>
  );
};

const RouteCardHeader = ({ type, actionDisabled, onAction }: RouteCardProps) => {
  const title = type === "mapping" ? "Mappings" : "Rules";
  const actionTooltip = type === "mapping" ? "Add a new mapping" : "Add a new rule";

  return (
    <CardHeader>
      <Typography variant="subtitle1" component="h2">
        {title}
      </Typography>

      <Box sx={{ flex: 1 }} />

      <GithubTooltip title={actionDisabled ? "Start adapter first" : actionTooltip}>
        <GithubButton size="small" disabled={actionDisabled} onClick={onAction}>
          <AddRoundedIcon fontSize="small" sx={{ mx: 0.5 }} />
          <ExpandMoreRoundedIcon fontSize="small" />
        </GithubButton>
      </GithubTooltip>
    </CardHeader>
  );
};

type RouteCardBodyProps = RouteCardProps & {
  items: { id: string; content: string; createdAt: number }[];
};

const RouteCardBody = ({ type, actionDisabled, onAction, items }: RouteCardBodyProps) => (
  <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
    {items.length > 0 ? (
      <RouteCardList>
        {items.map(({ id, content, createdAt }) => (
          <RouteCardListItem key={id} id={id} type={type} content={content} createdAt={createdAt} />
        ))}
      </RouteCardList>
    ) : (
      <RouteCardNoItemDisplay type={type} actionDisabled={actionDisabled} onAction={onAction} />
    )}
  </Box>
);

// -------------------------------------------------------------------------------

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
      <RouteCardHeader type="mapping" actionDisabled={addDisabled} onAction={handleOpen} />
      <RouteCardBody
        type="mapping"
        actionDisabled={addDisabled}
        onAction={handleOpen}
        items={mappings.map(({ id, mapping, createdAt }) => ({ id, content: mapping, createdAt }))}
      />

      <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
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
      <RouteCardHeader type="rule" actionDisabled={addDisabled} onAction={handleOpen} />
      <RouteCardBody
        type="rule"
        actionDisabled={addDisabled}
        onAction={handleOpen}
        items={rules.map(({ id, pattern, createdAt }) => ({ id, content: pattern, createdAt }))}
      />

      <CreateRulePopover anchorEl={anchorEl} onClose={handleClose} />
    </Card>
  );
};

// -------------------------------------------------------------------------------

const RouteCard = memo(() => {
  const role = useSession((state) => state.role);

  if (role === "client") return <MappingCard />;
  if (role === "host") return <RuleCard />;

  throw new Error("RouteCard must be used when role is either 'client' or 'host'");
});

RouteCard.displayName = "RouteCard";

export { RouteCard };
