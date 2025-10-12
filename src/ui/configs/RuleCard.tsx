import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { GithubSwitch, GithubTooltip } from "@/ui/components/Github";
import { Card, CardHeader, CardSubHeader } from "@/ui/components/Card";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";
import { handleChangeRules } from "@/adapter-state/handlers";
import type { Rules } from "@/adapter/adapter-host";

const configs: ReadonlyArray<{ rule: keyof Rules; label: string; description: string }> = [
  {
    rule: "allowIPv4Local",
    label: "Local IPv4 Access",
    description: "Allow access to localhost TCP services (127.0.0.0/8)",
  },
  {
    rule: "allowIPv6Local",
    label: "Local IPv6 Access",
    description: "Allow access to IPv6 localhost services (::1)",
  },
  {
    rule: "allowLAN",
    label: "LAN Access",
    description: "Allow access to devices in local network (NAS, databases, etc.)",
  },
];

const RuleCard = () => {
  const rules = useAdapter((state) => state.rules);
  const instance = useAdapter((state) => state.instance);
  const disabled = instance === null;

  // 注意: 由於是 IPC，因此很快，isChanging 只單純在 handler 避免重複而已，不會真的 disable UI
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (rule: keyof Rules, value: boolean) => {
    if (disabled || isChanging) return;
    setIsChanging(true);
    try {
      await handleChangeRules({ ...rules, [rule]: value });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsChanging(false);
    }
  };

  const createChangeHandler = (rule: keyof Rules) => () => {
    handleChange(rule, !rules[rule]);
  };

  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle1" component="h2">
            Rules
          </Typography>

          <GithubTooltip title="Changes apply to future connections only. Current connections will not be affected.">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "help", color: "text.secondary" }}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", "div:hover > &": { textDecoration: "underline" }, ...centerTextSx }}
              >
                applies only to new connections
              </Typography>
              <InfoOutlineRoundedIcon fontSize="small" color="inherit" />
            </Box>
          </GithubTooltip>
        </Box>
      </CardHeader>

      {error && (
        <CardSubHeader>
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        </CardSubHeader>
      )}

      <Stack>
        {configs.map(({ rule, label, description }, i) => (
          <Box key={rule}>
            <Box sx={{ p: 1.5, display: "flex", gap: 1.5, justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ textWrap: "nowrap" }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", ...ellipsisSx }}>
                  {description}
                </Typography>
              </Box>

              <GithubTooltip title={disabled ? "Adapter is not running" : ""}>
                <GithubSwitch checked={rules[rule]} onChange={createChangeHandler(rule)} disabled={disabled} />
              </GithubTooltip>
            </Box>
            {i < configs.length - 1 && <Divider />}
          </Box>
        ))}
      </Stack>
    </Card>
  );
};

export { RuleCard };
