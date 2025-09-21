import { Box, Typography, ButtonBase, Stack } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import { transition } from "@/components/utils";
import type { Role } from "@/native/webrtc";

const roleCardMap: Record<Role, { title: string; description: string; icon: React.ReactNode }> = {
  host: {
    title: "主持連線",
    description: "作為主持方，您將創建連接代碼並建立 WebRTC 連線",
    icon: <RouterRoundedIcon sx={{ fontSize: 96 }} />,
  },
  client: {
    title: "加入連線",
    description: "作為加入方，您將使用主持方的代碼加入 WebRTC 連線",
    icon: <ComputerRoundedIcon sx={{ fontSize: 96 }} />,
  },
};

type RoleCardProps = {
  role: Role;
  selected: boolean;
  onClick: () => void;
};

const RoleCard = ({ role, selected, onClick }: RoleCardProps) => {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        p: 3,
        borderRadius: 3,
        border: 2,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.50" : "background.paper",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        minHeight: 180,
        transition,
        "&:hover": {
          transform: "scale(1.02)",
          borderColor: selected ? "primary.main" : "primary.light",
          bgcolor: selected ? "primary.100" : "action.hover",
        },
        "&:active": {
          transform: "scale(0.98)",
        },
      }}
    >
      {/* 背景圖標 */}
      <Box
        sx={{
          position: "absolute",
          inset: "30% auto auto 25%",
          opacity: 0.3,
          transform: "rotate(15deg) scale(3)",
          color: "primary.main",
          zIndex: 0,
        }}
      >
        {roleCardMap[role].icon}
      </Box>

      {/* 內容區域 */}
      <Stack spacing={1} sx={{ position: "relative", zIndex: 1, flex: 1, width: "100%" }}>
        <Typography variant="h6" color="text.primary" align="left">
          {roleCardMap[role].title}
        </Typography>

        <Typography variant="body2" color="text.secondary" align="left">
          {roleCardMap[role].description}
        </Typography>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* 選中圖標 */}
        {selected && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <CheckCircleRoundedIcon
              sx={{
                color: "primary.main",
                animation: "checkPulse 0.6s ease-out",
                "@keyframes checkPulse": {
                  "0%": { transform: "scale(0)", opacity: 0 },
                  "50%": { transform: "scale(1.2)", opacity: 1 },
                  "100%": { transform: "scale(1)", opacity: 1 },
                },
              }}
            />
          </Box>
        )}
      </Stack>
    </ButtonBase>
  );
};

export { RoleCard };
