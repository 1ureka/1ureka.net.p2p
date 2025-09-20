import { Box, Typography, ButtonBase, Stack } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import { useFormStore, transition, type Role } from "./utils";

const roleCardMap: Record<Role, { title: string; description: string; icon: React.ReactNode }> = {
  host: {
    title: "主持連線",
    description: "作為連線的主持方，您將創建 offer 並等待對方的 answer",
    icon: <RouterRoundedIcon sx={{ fontSize: 96 }} />,
  },
  client: {
    title: "加入連線",
    description: "作為連線的加入方，您將接收對方的 offer 並創建 answer",
    icon: <ComputerRoundedIcon sx={{ fontSize: 96 }} />,
  },
};

const RoleCard = ({ role, selected, onClick }: { role: Role; selected: boolean; onClick: () => void }) => {
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

// TODO: 改成選擇 role, 輸入 code, 並可按下開始連線至 WebRTC，當連接狀態不為 fail, disconnected 時，禁用連線按鈕，connecting 時顯示 loading={true}

// TODO: 在連線時，會出現 circular progress，並且顯示目前進度訊息，透過以下設計: (但要轉成 MUI component and sx)
// <div className="relative h-32 overflow-hidden flex flex-col justify-end">
//     <AnimatePresence>
//       {history.slice(-5).map((item) => (
//         <motion.div
//           key={item.timestamp + item.message}
//           layout
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.3, ease: "easeOut" }}
//           className="text-sm text-gray-700"
//         >
//           {item.message}
//         </motion.div>
//       ))}
//     </AnimatePresence>
//   </div>

const Step1 = () => {
  const { selectedRole, setSelectedRole } = useFormStore();

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          選擇您的角色
        </Typography>
        <Typography variant="body2" color="text.secondary">
          請選擇您在 P2P 連接中的角色。主持方將建立連接請求，加入方將回應連接請求。
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <RoleCard role={"host"} selected={selectedRole === "host"} onClick={() => setSelectedRole("host")} />
        <RoleCard role={"client"} selected={selectedRole === "client"} onClick={() => setSelectedRole("client")} />
      </Box>
    </Stack>
  );
};

export { Step1 };
