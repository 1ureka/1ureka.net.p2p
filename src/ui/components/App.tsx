import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";

import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";

import { centerTextSx, ellipsisSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";

import { Header } from "@/ui/components/Header";
import { EventsCard } from "@/ui/components/EventsCard";
import { SessionCard } from "@/ui/components/SessionCard";
import { MappingCard } from "@/ui/components/MappingCard";

const App = () => {
  return (
    <Box
      sx={{ height: "100dvh", overflow: "auto" }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Header />
      <Box sx={{ display: "grid", gridTemplateColumns: "0.75fr 1fr", alignItems: "start", gap: 2, px: 4, py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SessionCard />
          <MappingCard />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Card>
              <CardHeader>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                  <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
                    Egress
                  </Typography>
                  <FileUploadRoundedIcon color="inherit" />
                </Box>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                  <Typography variant="subtitle1" component="h2" sx={{ color: "text.primary" }}>
                    Ingress
                  </Typography>
                  <FileDownloadRoundedIcon color="inherit" />
                </Box>
              </CardHeader>
            </Card>
          </Box>

          <EventsCard />
        </Box>
      </Box>
    </Box>
  );
};

export { App };
