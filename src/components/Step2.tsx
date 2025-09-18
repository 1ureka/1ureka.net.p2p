import { Box, Typography, Stack, Alert, IconButton, Tooltip } from "@mui/material";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import { useFormStore, type Role, transition } from "./utils";
import { TextField } from "./TextField";

// 生成假的 SDP 資料
const generateFakeOffer = (): string => {
  return `v=0
o=- ${Date.now()} 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=ice-ufrag:${Math.random().toString(36).substring(2, 6)}
a=ice-pwd:${Math.random().toString(36).substring(2, 26)}
a=ice-options:trickle
a=fingerprint:sha-256 ${Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join(":")}
a=setup:actpass
a=mid:0
a=sctp-port:5000
a=max-message-size:262144`;
};

const generateFakeAnswer = (): string => {
  return `v=0
o=- ${Date.now()} 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=ice-ufrag:${Math.random().toString(36).substring(2, 6)}
a=ice-pwd:${Math.random().toString(36).substring(2, 26)}
a=ice-options:trickle
a=fingerprint:sha-256 ${Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join(":")}
a=setup:active
a=mid:0
a=sctp-port:5000
a=max-message-size:262144`;
};

const HostTextFields = () => {
  const { offer, answer, setOffer, setAnswer } = useFormStore();

  const handleGenerateOffer = () => {
    setOffer(generateFakeOffer());
  };

  return (
    <>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1">Offer (SDP)</Typography>
          <Tooltip title="生成 Offer">
            <IconButton
              size="small"
              onClick={handleGenerateOffer}
              sx={{
                p: 0.5,
                borderRadius: 2,
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected", scale: "1.02" },
                "&:active": { scale: "0.98" },
                transition,
              }}
            >
              <AutoFixHighRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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

  const handleGenerateAnswer = () => {
    if (offer.trim()) {
      setAnswer(generateFakeAnswer());
    }
  };

  return (
    <>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Offer (SDP)
        </Typography>
        <TextField mode="paste" value={offer} onChange={setOffer} label="將對方的 offer 貼到這裡..." />
      </Box>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1">Answer (SDP)</Typography>
          <Tooltip title={offer.trim() ? "生成 Answer" : "請先輸入 Offer"}>
            <span>
              <IconButton
                size="small"
                onClick={handleGenerateAnswer}
                disabled={!offer.trim()}
                sx={{
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: offer.trim() ? "action.hover" : "action.disabledBackground",
                  "&:hover": offer.trim() ? { bgcolor: "action.selected", scale: "1.02" } : {},
                  "&:active": offer.trim() ? { scale: "0.98" } : {},
                  transition,
                }}
              >
                <AutoFixHighRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <TextField mode="copy" value={answer} onChange={setAnswer} label="您的 answer 將在這裡顯示" disabled />
      </Box>
    </>
  );
};

const HelperText = ({ role }: { role: Role }) => (
  <Alert
    severity="info"
    variant="outlined"
    sx={{ borderRadius: 2, borderStyle: "dashed", borderWidth: 2, borderColor: "#71A5BF50" }}
    icon={role === "host" ? <RouterRoundedIcon /> : <ComputerRoundedIcon />}
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
