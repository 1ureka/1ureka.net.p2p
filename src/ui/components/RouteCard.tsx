import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import { Box, Typography, Tooltip, Zoom } from "@mui/material";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

function formatElapsed(elapsed: number) {
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  // padStart(2, '0') 讓數字補成兩位數
  return [String(hours).padStart(2, "0"), String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].join(":");
}

type RouteCardListItemProps = {
  type: "mapping" | "rule";
  index: number;
  content: string;
  elapsed: number;
};

const RouteCardListItem = ({ type, index, content, elapsed }: RouteCardListItemProps) => {
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
          {type} #{index}
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
          {formatElapsed(elapsed)}
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

const MappingCard = () => {
  const fakeData = [
    { index: 1, content: "0.0.0.0.0.0:52234 <=> 0.0.0.0.0.0:52235", elapsed: 12345 },
    { index: 2, content: "0.0.0.0.0.0:3000 <=> 0.0.0.0.0.0:3000", elapsed: 1255 },
    { index: 3, content: "0.0.0.0.0.0:4000 <=> 0.0.0.0.0.0:4000", elapsed: 6789 },
    { index: 4, content: "0.0.0.0.0.0:5000 <=> 192.168.1.1:5000", elapsed: 9876 },
  ];

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubButton sx={{ py: 0.5, px: 1, bgcolor: "background.default" }} startIcon={<AddBoxRoundedIcon />}>
          <Typography variant="body2" sx={{ textTransform: "none", textWrap: "nowrap", ...centerTextSx }}>
            add
          </Typography>
        </GithubButton>
      </CardHeader>

      <RouteCardList>
        {fakeData.map(({ index, content, elapsed }) => (
          <RouteCardListItem key={index} type="mapping" index={index} content={content} elapsed={elapsed} />
        ))}
      </RouteCardList>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

const RuleCard = () => {
  const fakeData = [
    { index: 1, content: "192.168.102.100:3000", elapsed: 12345 },
    { index: 2, content: "127.0.*.*:*", elapsed: 1255 },
  ];

  return (
    <Card>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Rules
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <GithubButton sx={{ py: 0.5, px: 1, bgcolor: "background.default" }} startIcon={<AddBoxRoundedIcon />}>
          <Typography variant="body2" sx={{ textTransform: "none", textWrap: "nowrap", ...centerTextSx }}>
            add
          </Typography>
        </GithubButton>
      </CardHeader>

      <RouteCardList>
        {fakeData.map(({ index, content, elapsed }) => (
          <RouteCardListItem key={index} type="rule" index={index} content={content} elapsed={elapsed} />
        ))}
      </RouteCardList>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { MappingCard, RuleCard };
