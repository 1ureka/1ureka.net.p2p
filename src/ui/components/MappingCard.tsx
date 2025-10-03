import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import { Box, Button, Typography } from "@mui/material";
import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";

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
        <Button sx={{ minWidth: 0, p: 0.5 }} color="inherit">
          <StopRoundedIcon fontSize="small" />
        </Button>
        <Button sx={{ minWidth: 0, p: 0.5 }} color="inherit">
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        "& > div:nth-of-type(2n)": {
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
        },
      }}
    >
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

export { MappingCard };
