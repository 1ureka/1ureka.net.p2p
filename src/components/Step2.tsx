import { Box, Typography, Stack, Alert } from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import { useFormStore, type Role } from "./utils";
import { TextField } from "./TextField";

const HostTextFields = () => {
  const { offer, answer, setOffer, setAnswer } = useFormStore();
  return (
    <>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Offer (SDP)
        </Typography>
        <TextField mode="copy" value={offer} onChange={setOffer} label="您的 offer 將在這裡顯示" disabled />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Answer (SDP)
        </Typography>
        <TextField mode="paste" value={answer} onChange={setAnswer} label="將對方的 answer 貼到這裡..." />
      </Box>
    </>
  );
};

const ClientTextFields = () => {
  const { offer, answer, setOffer, setAnswer } = useFormStore();
  return (
    <>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Offer (SDP)
        </Typography>
        <TextField mode="copy" value={offer} onChange={setOffer} label="將對方的 offer 貼到這裡..." />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Answer (SDP)
        </Typography>
        <TextField mode="paste" value={answer} onChange={setAnswer} label="您的 answer 將在這裡顯示" disabled />
      </Box>
    </>
  );
};

const HelperText = ({ role }: { role: Role }) => (
  <Alert
    severity="info"
    variant="outlined"
    sx={{ borderRadius: 2, borderStyle: "dashed", borderWidth: 2, borderColor: "#71A5BF50" }}
    icon={role === "host" ? <PhoneRoundedIcon /> : <PhoneInTalkRoundedIcon />}
  >
    {role === "host"
      ? "作為主持方，請先將您的 offer 提供給對方，然後將對方回傳的 answer 貼上到右側欄位。"
      : "作為加入方，請先將對方的 offer 貼上到左側欄位，然後將您的 answer 提供給對方。"}
  </Alert>
);

const Step2 = () => {
  const { selectedRole } = useFormStore();

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          交換 SDP 資訊
        </Typography>
        <Typography variant="body2" color="text.secondary">
          根據您選擇的角色，請在對應的欄位中輸入或複製相關的 SDP 資訊。主持方需要提供 offer，加入方需要提供 answer。
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {selectedRole === "host" ? <HostTextFields /> : <ClientTextFields />}
      </Box>

      <HelperText role={selectedRole} />
    </Stack>
  );
};

export { Step2 };
