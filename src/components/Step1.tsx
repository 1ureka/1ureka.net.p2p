import { Box, Typography, ButtonBase, Stack } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import { useFormStore, transition } from "./utils";

interface RoleCardProps {
  role: "caller" | "receiver";
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

const RoleCard = ({ role, title, description, icon, selected, onClick }: RoleCardProps) => {
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
          //   top: -20,
          //   right: -20,
          inset: "60% auto auto 25%",
          opacity: 0.3,
          transform: "rotate(15deg) scale(3)",
          color: "primary.main",
          zIndex: 0,
        }}
      >
        {icon}
      </Box>

      {/* 內容區域 */}
      <Stack spacing={1} sx={{ position: "relative", zIndex: 1, flex: 1, width: "100%" }}>
        <Typography variant="h6" color="text.primary" align="left">
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" align="left">
          {description}
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

const Step1 = () => {
  const { selectedRole, setSelectedRole } = useFormStore();

  const roles = [
    {
      role: "caller" as const,
      title: "發起通話",
      description: "作為通話的發起方，您將創建 offer 並等待對方的 answer",
      icon: <PhoneIcon sx={{ fontSize: 128 }} />,
    },
    {
      role: "receiver" as const,
      title: "接收通話",
      description: "作為通話的接收方，您將接收對方的 offer 並創建 answer",
      icon: <PhoneInTalkIcon sx={{ fontSize: 128 }} />,
    },
  ];

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          選擇您的角色
        </Typography>
        <Typography variant="body2" color="text.secondary">
          請選擇您在 P2P 連接中的角色。發起方將建立連接請求，接收方將回應連接請求。
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {roles.map((roleData) => (
          <RoleCard
            key={roleData.role}
            role={roleData.role}
            title={roleData.title}
            description={roleData.description}
            icon={roleData.icon}
            selected={selectedRole === roleData.role}
            onClick={() => setSelectedRole(roleData.role)}
          />
        ))}
      </Box>
    </Stack>
  );
};

export { Step1 };
