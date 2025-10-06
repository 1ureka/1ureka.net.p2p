import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import { Box, Typography, Tooltip, Zoom } from "@mui/material";
import { ellipsisSx } from "@/ui/theme";
import { GithubButton } from "@/ui/components/Github";

import { handleRemoveMapping, handleRemoveRule } from "@/adapter/store";
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
  //   const stopTooltip = type === "mapping" ? "Disable mapping" : "Disable rule";
  const stopTooltip = "work in progress";
  const deleteTooltip = type === "mapping" ? "Remove mapping" : "Remove rule";

  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    if (type === "mapping") {
      await handleRemoveMapping(id);
    } else {
      await handleRemoveRule(id);
    }
  };

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
          <Box>
            <GithubButton sx={{ minWidth: 0, p: 0.2 }} color="inherit" disabled>
              <StopRoundedIcon fontSize="small" />
            </GithubButton>
          </Box>
        </Tooltip>
        <Tooltip title={deleteTooltip} arrow placement="right" slots={{ transition: Zoom }}>
          <GithubButton sx={{ minWidth: 0, p: 0.2 }} color="inherit" onClick={handleDelete} loading={loading}>
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

export { RouteCardList, RouteCardListItem };
