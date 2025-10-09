import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Typography } from "@mui/material";
import { GithubTooltip } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

import { centerTextSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

const RuleCard = () => {
  const rules = useAdapter((state) => state.rules);
  const instance = useAdapter((state) => state.instance);

  const disabled = instance === null;
  const [loading, setLoading] = useState(false);

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Rules
        </Typography>

        <GithubTooltip title={""}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "help" }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", "div:hover > &": { textDecoration: "underline" }, ...centerTextSx }}
            >
              {/* TODO: only affect already [問號icon] ，懸停顯示完整 tooltip */}
            </Typography>
            <InfoOutlineRoundedIcon fontSize="small" />
          </Box>
        </GithubTooltip>
      </CardHeader>

      {/* TODO: 呈現四個選項，disabled 時提示 actionDisabled ? "Start adapter first" : tooltip */}
      <Box sx={{ flex: 1 }} />
    </Card>
  );
};

export { RuleCard };
