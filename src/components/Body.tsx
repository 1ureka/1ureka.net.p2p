import { Box, Paper, Stack, Typography, Button } from "@mui/material";
import { useState } from "react";

const Indicator = ({ steps, current }: { steps: string[]; current: number }) => {
  return (
    <Box sx={{ display: "grid", gap: 5, gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
      {steps.map((step, index) => (
        <Stack sx={{ gap: 1 }} key={step}>
          <Box
            sx={{
              width: 1,
              py: 0.5,
              position: "relative",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: current === index ? "scale(1.05)" : "scale(1)",
            }}
          >
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "divider", borderRadius: 99 }} />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: current >= index ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "center left",
                bgcolor: "primary.main",
                borderRadius: 99,
                overflow: "hidden",
                "&::after":
                  current === index
                    ? {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        borderRadius: 99,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                        animation: "shimmer 2s ease-in-out infinite",
                      }
                    : {},
                "@keyframes shimmer": {
                  "0%": { transform: "translateX(-100%)" },
                  "100%": { transform: "translateX(100%)" },
                },
              }}
            />
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              color: current === index ? "primary.main" : "text.secondary",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: current === index ? "scale(1.05)" : "scale(1)",
            }}
          >
            {step}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

type StepWrapperProps = { children: React.ReactNode; stepIndex: number; currentIndex: number };
const StepWrapper = ({ children, stepIndex, currentIndex }: StepWrapperProps) => {
  const offset = stepIndex - currentIndex;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        opacity: offset === 0 ? 1 : 0,
        filter: offset === 0 ? "blur(0px)" : "blur(2px)",
        transform: offset === 0 ? "translateX(0) scale(1)" : `translateX(${offset * 100}px) scale(0.95)`,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: offset === 0 ? "auto" : "none",
      }}
    >
      {children}
    </Box>
  );
};

const Body = () => {
  const [step, setStep] = useState<{ current: number; prev: number }>({ current: 0, prev: 0 });
  const steps = ["選擇角色", "交換 order / answer", "交換 ICE candidate"];

  const handlePrevStep = () => {
    setStep((prev) => ({ current: Math.max(0, prev.current - 1), prev: prev.current }));
  };

  const handleNextStep = () => {
    setStep((prev) => ({ current: Math.min(steps.length - 1, prev.current + 1), prev: prev.current }));
  };

  return (
    <Box sx={{ position: "relative", flex: 1, display: "grid", placeItems: "center", minHeight: 0 }}>
      <Paper sx={{ p: 5, borderRadius: 5, width: 0.8, maxHeight: 1, overflow: "auto" }}>
        <Stack spacing={4}>
          <Indicator steps={steps} current={step.current} />

          {/* StepWrapper 測試區域 */}
          <Box
            sx={{
              position: "relative",
              height: "200px",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {steps.map((stepName, index) => (
              <StepWrapper key={stepName} stepIndex={index} currentIndex={step.current}>
                <Stack spacing={2} alignItems="center">
                  <Typography variant="h5" color="primary">
                    {stepName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    這是第 {index + 1} 步的內容區域
                  </Typography>
                  <Button variant="contained" size="small">
                    {stepName === "選擇角色" ? "選擇" : stepName === "交換 order / answer" ? "開始交換" : "交換 ICE"}
                  </Button>
                </Stack>
              </StepWrapper>
            ))}
          </Box>

          {/* 測試按鈕組 */}
          <Stack spacing={2}>
            <Typography variant="h6" color="text.secondary" align="center">
              測試控制區域 (臨時)
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button variant="outlined" onClick={handlePrevStep} disabled={step.current === 0}>
                上一步
              </Button>
              <Button variant="contained" onClick={handleNextStep} disabled={step.current === steps.length - 1}>
                下一步
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export { Body };
