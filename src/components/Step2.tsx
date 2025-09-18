import { Box, Typography, TextField, IconButton, Tooltip, Stack, Alert } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import { transition, tryCatch, useFormStore, type Role } from "./utils";

const copyPasteMap = {
  copy: { title: "複製", icon: <ContentCopyRoundedIcon fontSize="small" /> },
  paste: { title: "從剪貼板貼上", icon: <ContentPasteRoundedIcon fontSize="small" /> },
} as const;

const handleCopy = async (text: string, callback: () => void) => {
  const { error } = await tryCatch(navigator.clipboard.writeText(text));
  if (error) return console.error("複製失敗:", error);
  callback();
};

const handlePaste = async (callback: (text: string) => void) => {
  const { data: text, error } = await tryCatch(navigator.clipboard.readText());
  if (error) return console.error("貼上失敗:", error);
  callback(text);
};

type CopyPasteButtonProps =
  | { type: "copy"; text: string; setter?: never }
  | { type: "paste"; text?: never; setter: (value: string) => void };

const CopyPasteButton = ({ type, text, setter }: CopyPasteButtonProps) => {
  return (
    <Tooltip title={copyPasteMap[type].title}>
      <IconButton
        size="small"
        onClick={() => {
          if (type === "copy") handleCopy(text, () => {});
          else handlePaste(setter);
        }}
        sx={{
          p: 0.5,
          borderRadius: 2,
          bgcolor: "action.hover",
          "&:hover": { bgcolor: "action.selected", scale: "1.02" },
          "&:active": { scale: "0.98" },
          transition,
        }}
      >
        {copyPasteMap[type].icon}
      </IconButton>
    </Tooltip>
  );
};

const infoFieldMap = {
  host: {
    order: { label: "您的 offer 將在這裡顯示", disabled: true, buttonType: "copy" },
    answer: { label: "將對方的 answer 貼到這裡...", disabled: false, buttonType: "paste" },
  },
  client: {
    order: { label: "將對方的 offer 貼到這裡...", disabled: false, buttonType: "paste" },
    answer: { label: "您的 answer 將在這裡顯示", disabled: true, buttonType: "copy" },
  },
} as const;

type InfoFieldType = Omit<TextFieldProps, "role"> & {
  role: Role;
  type: "order" | "answer";
  value: string;
  onCopyPaste: () => void;
};

const InfoField = ({ role, type, value, onChange, onCopyPaste }: InfoFieldType) => {
  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        fullWidth
        multiline
        rows={8}
        placeholder={infoFieldMap[role][type].label}
        value={value}
        onChange={onChange}
        disabled={infoFieldMap[role][type].disabled}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, "&.Mui-disabled": { bgcolor: "action.hover" } } }}
      />
      <Box sx={{ position: "absolute", inset: "auto 0 0 auto", p: 2 }}>
        {infoFieldMap[role][type].buttonType === "copy" ? (
          <CopyPasteButton type="copy" text={value} />
        ) : (
          <CopyPasteButton type="paste" setter={onCopyPaste} />
        )}
      </Box>
    </Box>
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
          根據您選擇的角色，請在對應的欄位中輸入或複製相關的 SDP 資訊。主持方需要提供 offer，加入方需要提供 answer。
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Offer (SDP)
          </Typography>
          <InfoField
            role={selectedRole}
            type="order"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            onCopyPaste={() => {
              if (selectedRole === "host") handleCopy(order, "Offer");
              else handlePaste(setOrder, "Offer");
            }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Answer (SDP)
          </Typography>
          <InfoField
            role={selectedRole}
            type="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onCopyPaste={() => {
              if (selectedRole === "client") handleCopy(answer, "Answer");
              else handlePaste(setAnswer, "Answer");
            }}
          />
        </Box>
      </Box>

      {selectedRole && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ borderRadius: 2, borderStyle: "dashed", borderWidth: 2, borderColor: "#71A5BF50" }}
          icon={selectedRole === "host" ? <PhoneRoundedIcon /> : <PhoneInTalkRoundedIcon />}
        >
          {selectedRole === "host"
            ? "作為主持方，請先將您的 offer 提供給對方，然後將對方回傳的 answer 貼上到右側欄位。"
            : "作為加入方，請先將對方的 offer 貼上到左側欄位，然後將您的 answer 提供給對方。"}
        </Alert>
      )}
    </Stack>
  );
};

export { Step2 };
