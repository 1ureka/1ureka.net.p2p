import SignpostRoundedIcon from "@mui/icons-material/SignpostRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import { useEffect, useState } from "react";
import { Box, type BoxProps, Typography } from "@mui/material";
import { motion } from "motion/react";
import { ellipsisSx } from "@/ui/theme";
import { GithubButton, GithubTooltip } from "@/ui/components/Github";
import { handleRemoveMapping } from "@/adapter-state/handlers";

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

type ConfigsCardListItemProps = {
  id: string;
  content: string;
  createdAt: number;
};

const listItemSx: BoxProps["sx"] = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gridAutoRows: "auto",
  gap: 0.5,
  rowGap: 1,
  p: 1.5,
  borderBottom: "2px solid",
  borderColor: "divider",
  "& div:nth-of-type(2n)": { justifySelf: "end" },
  transition: "background-color 0.3s ease",
};

const MappingCardListItem = ({ id, content, createdAt }: ConfigsCardListItemProps) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await handleRemoveMapping(id);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      layout="position"
      sx={listItemSx}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
        <SignpostRoundedIcon color="inherit" fontSize="small" />
        <Typography variant="body2" sx={ellipsisSx}>
          mapping #{id}
        </Typography>
      </Box>

      <GithubTooltip title={"Remove mapping"}>
        <GithubButton sx={{ minWidth: 0, p: 0.2 }} color="inherit" onClick={handleDelete} loading={loading}>
          <DeleteForeverRoundedIcon fontSize="small" />
        </GithubButton>
      </GithubTooltip>

      <Typography variant="body2" sx={{ fontFamily: "Ubuntu", ...ellipsisSx }}>
        {content}
      </Typography>

      <GithubTooltip title="Elapsed time since created">
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", "&:hover": { textDecoration: "underline" }, ...ellipsisSx }}
        >
          <ElapsedDisplay createdAt={createdAt} />
        </Typography>
      </GithubTooltip>
    </Box>
  );
};

const listSx: BoxProps["sx"] = {
  display: "flex",
  flexDirection: "column",
  "& > div:nth-of-type(2n)": { bgcolor: "background.paper", "& button": { bgcolor: "background.default" } },
};

const MappingCardList = ({ children }: { children: React.ReactNode }) => <Box sx={listSx}>{children}</Box>;

export { MappingCardList, MappingCardListItem };
