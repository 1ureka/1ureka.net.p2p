import { Box, Typography, Stack } from "@mui/material";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";

const Step3 = () => {
  return (
    <Stack spacing={3} sx={{ width: "100%", textAlign: "center" }}>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          ICE Candidate 交換
        </Typography>
        <Typography variant="body2" color="text.secondary">
          此功能正在開發中，敬請期待...
        </Typography>
      </Box>

      <Box sx={{ py: 8 }}>
        <Stack spacing={3} alignItems="center">
          <ConstructionRoundedIcon
            sx={{
              fontSize: 80,
              color: "warning.main",
              animation: "bounce 2s infinite",
              "@keyframes bounce": {
                "0%, 20%, 50%, 80%, 100%": {
                  transform: "translateY(0)",
                },
                "40%": {
                  transform: "translateY(-10px)",
                },
                "60%": {
                  transform: "translateY(-5px)",
                },
              },
            }}
          />

          <Typography variant="h6" color="text.secondary">
            功能開發中
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            ICE Candidate 交換功能正在積極開發中，將支援完整的 WebRTC 連接建立流程。 請先完成前面的步驟設置。
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
};

export { Step3 };
