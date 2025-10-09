import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { GithubTooltip } from "@/ui/components/Github";
import { Card, CardHeader } from "@/ui/components/Card";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";
import type { Rules } from "@/adapter/adapter-host";
import { handleChangeRules } from "@/adapter-state/handlers";

const configs: ReadonlyArray<{ rule: keyof Rules; label: string; description: string }> = [
  {
    rule: "allowIPv4Local",
    label: "Local IPv4 Access",
    description: "Allow access localhost TCP services (127.0.0.0/8)",
  },
  {
    rule: "allowIPv6Local",
    label: "Local IPv6 Access",
    description: "Allow access IPv6 localhost services (::1)",
  },
  {
    rule: "allowLAN",
    label: "LAN Access",
    description: "Allow access devices in local network (NAS, databases, etc.)",
  },
  {
    rule: "allowExternal",
    label: "External Access",
    description: "Allow access public internet and external services",
  },
];

const RuleCard = () => {
  const rules = useAdapter((state) => state.rules);
  const instance = useAdapter((state) => state.instance);

  const disabled = instance === null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (rule: keyof Rules, value: boolean) => {
    if (disabled) return;
    setLoading(true);
    try {
      await handleChangeRules({ ...rules, [rule]: value });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle1" component="h2">
            Rules
          </Typography>

          <GithubTooltip title="Rules only affect new connections. Existing connections remain unaffected when rules are changed during an active session.">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "help", color: "text.secondary" }}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", "div:hover > &": { textDecoration: "underline" }, ...centerTextSx }}
              >
                affects new connections only
              </Typography>
              <InfoOutlineRoundedIcon fontSize="small" color="inherit" />
            </Box>
          </GithubTooltip>
        </Box>
      </CardHeader>

      {/* TODO: 呈現四個選項，disabled 時提示 actionDisabled ? "Start adapter first" : tooltip */}
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

              {/* TODO: switch */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={centerTextSx}>
                  On
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    borderRadius: 1.5,
                    transition: "background-color 0.2s",
                    bgcolor: "primary.dark",
                    outline: "2px solid",
                    outlineColor: "transparent",
                  }}
                >
                  <Box sx={{ display: "grid", placeItems: "center", p: 0.5 }}>
                    <HorizontalRuleRoundedIcon
                      sx={{ rotate: "90deg", fontSize: 16, scale: "1", transition: "scale 0.2s" }}
                    />
                  </Box>
                  <Box sx={{ display: "grid", placeItems: "center", p: 0.5 }}>
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, scale: "0", transition: "scale 0.2s" }} />
                  </Box>

                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      left: "50%",
                      m: "2px",
                      borderRadius: 1.5,
                      bgcolor: "text.primary",
                      transition: "background-color 0.2s, left 0.2s",
                    }}
                  />
                </Box>
              </Box>
            </Box>
            {i < configs.length - 1 && <Divider />}
          </Box>
        ))}
      </Stack>
    </Card>
  );
};

export { RuleCard };
