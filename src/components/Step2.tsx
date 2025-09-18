import { Box, Typography, TextField, IconButton, Tooltip, Stack, Alert } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import { useFormStore, type Role } from "./utils";

const CopyPasteButton = ({ type, onClick }: { type: "copy" | "paste"; onClick: () => void }) => {
  return (
    <Tooltip title={type === "copy" ? "複製" : "從剪貼板貼上"}>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{ "&:hover": { bgcolor: "action.hover", transform: "scale(1.1)" } }}
      >
        {type === "copy" ? <ContentCopyRoundedIcon fontSize="small" /> : <ContentPasteRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

const InfoField = ({
  role,
  type,
  value,
  onChange,
}: Omit<TextFieldProps, "role"> & { role: Role; type: "order" | "answer" }) => {
  const placeholderMap = {
    host: { order: "您的 offer 將在這裡顯示", answer: "將對方的 answer 貼到這裡..." },
    client: { order: "將對方的 offer 貼到這裡...", answer: "您的 answer 將在這裡顯示" },
  };

  const placeholder = role ? placeholderMap[role === "caller" ? "host" : "client"][type] : "";
  const disabled = (role === "caller" && type === "order") || (role === "receiver" && type === "answer");

  return (
    <TextField
      fullWidth
      multiline
      rows={8}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, "&.Mui-disabled": { bgcolor: "action.hover" } } }}
    />
  );
};

const Step2 = () => {
  const { selectedRole, order, answer, setOrder, setAnswer } = useFormStore();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // 可以在這裡添加成功提示
        console.log(`已複製 ${label} 到剪貼板`);
      })
      .catch((err) => {
        console.error("複製失敗:", err);
      });
  };

  const handlePaste = async (setter: (value: string) => void, label: string) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
      console.log(`已從剪貼板貼上 ${label}`);
    } catch (err) {
      console.error("貼上失敗:", err);
    }
  };

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          交換 SDP 資訊
        </Typography>
        <Typography variant="body2" color="text.secondary">
          根據您選擇的角色，請在對應的欄位中輸入或複製相關的 SDP 資訊。發起方需要提供 offer，接收方需要提供 answer。
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <Stack spacing={1}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1">Offer (SDP)</Typography>
            {selectedRole === "caller" && order && (
              <CopyPasteButton type="copy" onClick={() => handleCopy(order, "Offer")} />
            )}
            {selectedRole === "receiver" && (
              <CopyPasteButton type="paste" onClick={() => handlePaste(setOrder, "Offer")} />
            )}
          </Box>

          <InfoField role={selectedRole} type="order" value={order} onChange={(e) => setOrder(e.target.value)} />
        </Stack>

        <Stack spacing={1}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1">Answer (SDP)</Typography>
            {selectedRole === "caller" && answer && (
              <CopyPasteButton type="paste" onClick={() => handlePaste(setAnswer, "Answer")} />
            )}
            {selectedRole === "receiver" && (
              <CopyPasteButton type="copy" onClick={() => handleCopy(answer, "Answer")} />
            )}
          </Box>

          <InfoField role={selectedRole} type="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </Stack>
      </Box>

      {selectedRole && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ borderRadius: 2, borderStyle: "dashed", borderWidth: 2, borderColor: "#71A5BF50" }}
          icon={selectedRole === "caller" ? <PhoneIcon /> : <PhoneInTalkIcon />}
        >
          {selectedRole === "caller"
            ? "作為發起方，請先將您的 offer 提供給對方，然後將對方回傳的 answer 貼上到右側欄位。"
            : "作為接收方，請先將對方的 offer 貼上到左側欄位，然後將您的 answer 提供給對方。"}
        </Alert>
      )}
    </Stack>
  );
};

export { Step2 };
