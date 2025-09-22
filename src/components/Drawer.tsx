import { Box, Button, Drawer, Typography, type DrawerProps } from "@mui/material";
import { buttonContainedSx } from "./utils";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";

const LogDrawer = ({ open, onClose }: DrawerProps) => {
  const handleStartTestServer = () => {
    window.electron.send("test.server");
  };

  const handleStartTestClient = () => {
    window.electron.send("test.client");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        paper: {
          elevation: 3,
          sx: {
            p: 3,
            width: 450,
            borderRadius: ({ shape: { borderRadius } }) =>
              `${(borderRadius as number) * 5}px 0 0 ${(borderRadius as number) * 5}px`,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          測試工具
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<StorageRoundedIcon />}
            onClick={handleStartTestServer}
            sx={{
              ...buttonContainedSx,
              justifyContent: "flex-start",
              py: 1.5,
              px: 2,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ml: 1 }}>
              <Typography variant="button">啟動測試服務器</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, textTransform: "none" }}>
                開啟 TestServer 進行連接測試
              </Typography>
            </Box>
          </Button>

          <Button
            variant="contained"
            startIcon={<ComputerRoundedIcon />}
            onClick={handleStartTestClient}
            sx={{
              ...buttonContainedSx,
              justifyContent: "flex-start",
              py: 1.5,
              px: 2,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ml: 1 }}>
              <Typography variant="button">啟動測試客戶端</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, textTransform: "none" }}>
                開啟 TestClient 連接到服務器
              </Typography>
            </Box>
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export { LogDrawer };
