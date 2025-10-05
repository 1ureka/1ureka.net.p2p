import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";

import { Box, Typography } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubHeaderButton } from "@/ui/components/Github";
import { RouteCardList, RouteCardListItem } from "@/ui/components/RouteCardList";
import { RouteCardDialog } from "@/ui/components/RouteCardDialog";

import { useSession } from "@/transport/store";
import { useAdapter } from "@/adapter/store";
import { useState } from "react";
import { stringifySocketPair } from "@/adapter/ip";

const NoItemDisplay = ({ type, action }: { type: "mapping" | "rule"; action: React.ReactNode }) => {
  const title = type === "mapping" ? "No mappings yet" : "No rules defined";
  const description =
    type === "mapping"
      ? "You haven’t added any port mappings yet. Create one to connect local and remote ports."
      : "You haven’t defined any access rules yet. Add one to allow incoming connections.";

  return (
    <Box sx={{ py: 6, px: 2, color: "text.secondary", display: "grid", placeItems: "center" }}>
      <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

      <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
        {description}
      </Typography>

      {action}
    </Box>
  );
};

const MappingCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const mappings = useAdapter((state) => state.mappings);
  const status = useSession((state) => state.status);
  const disabled = status !== "connected";

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={disabled} onClick={handleOpen}>
          add
        </GithubHeaderButton>
        <RouteCardDialog anchorEl={anchorEl} type="mapping" onClose={handleClose} />
      </CardHeader>

      {mappings.size <= 0 && (
        <NoItemDisplay
          type="mapping"
          action={
            <GithubButton
              sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
              startIcon={<AddBoxRoundedIcon />}
              disabled={disabled}
              onClick={handleOpen}
            >
              <Typography variant="body2">Add mapping</Typography>
            </GithubButton>
          }
        />
      )}

      {mappings.size > 0 && (
        <RouteCardList>
          {Array.from(mappings.entries()).map(([id, { map, createdAt }]) => (
            <RouteCardListItem
              key={id}
              id={id}
              type="mapping"
              content={stringifySocketPair(map)}
              createdAt={createdAt}
            />
          ))}
        </RouteCardList>
      )}

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

const RuleCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const rules = useAdapter((state) => state.rules);
  const status = useSession((state) => state.status);
  const disabled = status !== "connected";

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Rules
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={disabled} onClick={handleOpen}>
          add
        </GithubHeaderButton>
        <RouteCardDialog anchorEl={anchorEl} type="rule" onClose={handleClose} />
      </CardHeader>

      {rules.size <= 0 && (
        <NoItemDisplay
          type="rule"
          action={
            <GithubButton
              sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
              startIcon={<AddBoxRoundedIcon />}
              disabled={disabled}
              onClick={handleOpen}
            >
              <Typography variant="body2">Add rule</Typography>
            </GithubButton>
          }
        />
      )}

      {rules.size > 0 && (
        <RouteCardList>
          {Array.from(rules.entries()).map(([id, { pattern, createdAt }]) => (
            <RouteCardListItem key={id} id={id} type="rule" content={pattern} createdAt={createdAt} />
          ))}
        </RouteCardList>
      )}

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { MappingCard, RuleCard };
