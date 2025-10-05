import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";

import { Box, Typography, Tooltip, Zoom } from "@mui/material";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubButton, GithubHeaderButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

import { useSession } from "@/transport/store";
import { useAdapter } from "@/adapter/store";
import { stringifySocketPair } from "@/adapter/ip";
import { useEffect, useState } from "react";

function formatElapsed(elapsed: number) {
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  // padStart(2, '0') 讓數字補成兩位數
  return [String(hours).padStart(2, "0"), String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].join(":");
}

const ElapsedDisplay = ({ createdAt }: { createdAt: number }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatElapsed(Math.floor((now - createdAt) / 1000))}</>;
};

type RouteCardListItemProps = {
  id: string;
  type: "mapping" | "rule";
  content: string;
  createdAt: number;
};

const RouteCardListItem = ({ id, type, content, createdAt }: RouteCardListItemProps) => {
  const stopTooltip = type === "mapping" ? "Disable mapping" : "Disable rule";
  const deleteTooltip = type === "mapping" ? "Remove mapping" : "Remove rule";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridAutoRows: "auto",
        gap: 0.5,
        "& div:nth-of-type(2n)": { justifySelf: "end" },
        p: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
        <SignpostRoundedIcon color="inherit" fontSize="small" />
        <Typography variant="body2">
          {type} #{id}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={stopTooltip} arrow placement="left" slots={{ transition: Zoom }}>
          <GithubButton sx={{ minWidth: 0, p: 0.2 }} color="inherit">
            <StopRoundedIcon fontSize="small" />
          </GithubButton>
        </Tooltip>
        <Tooltip title={deleteTooltip} arrow placement="right" slots={{ transition: Zoom }}>
          <GithubButton sx={{ minWidth: 0, p: 0.2 }} color="inherit">
            <DeleteForeverRoundedIcon fontSize="small" />
          </GithubButton>
        </Tooltip>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ ...ellipsisSx, fontFamily: "Ubuntu" }}>
          {content}
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ color: "text.secondary", pr: 1, ...ellipsisSx }}>
          <ElapsedDisplay createdAt={createdAt} />
        </Typography>
      </Box>
    </Box>
  );
};

const RouteCardList = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        "& > div:nth-of-type(2n)": {
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          "& button": { bgcolor: "background.default" },
        },
      }}
    >
      {children}
    </Box>
  );
};

const NoItemDisplay = ({ type }: { type: "mapping" | "rule" }) => {
  const status = useSession((state) => state.status);
  const disabled = status !== "connected";

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

      <GithubButton
        sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
        startIcon={<AddBoxRoundedIcon />}
        disabled={disabled}
      >
        <Typography variant="body2">{type === "mapping" ? "Add mapping" : "Add rule"}</Typography>
      </GithubButton>
    </Box>
  );
};

const MappingCard = () => {
  const mappings = useAdapter((state) => state.mappings);
  const status = useSession((state) => state.status);
  const disabled = status !== "connected";

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={disabled}>
          add
        </GithubHeaderButton>
      </CardHeader>

      {mappings.size <= 0 && <NoItemDisplay type="mapping" />}

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
  const rules = useAdapter((state) => state.rules);
  const status = useSession((state) => state.status);
  const disabled = status !== "connected";

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Rules
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={disabled}>
          add
        </GithubHeaderButton>
      </CardHeader>

      {rules.size <= 0 && <NoItemDisplay type="rule" />}

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
