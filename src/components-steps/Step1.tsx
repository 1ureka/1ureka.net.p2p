import { Box } from "@mui/material";
import { RoleCard } from "@/components-steps/Step1Card";
import { StepDescription } from "./StepDescription";
import { useFormStore } from "@/store/form";

const Step1 = () => {
  const role = useFormStore((state) => state.role);
  const setRole = useFormStore((state) => state.setRole);

  return (
    <Box sx={{ width: 1, height: 1, display: "grid", gridTemplateRows: "auto 1fr", gap: 3 }}>
      <StepDescription
        title="選擇角色"
        description="若你是提供本地 TCP 服務方，請選擇「主持連線」，若你是連接的客戶端，請選擇「加入連線」"
      />

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <RoleCard role={"host"} selected={role === "host"} onClick={() => setRole("host")} />
        <RoleCard role={"client"} selected={role === "client"} onClick={() => setRole("client")} />
      </Box>
    </Box>
  );
};

export { Step1 };
