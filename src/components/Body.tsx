import { Box, Paper, Stack, Typography } from "@mui/material";
import { Step1 } from "./Step1";
import { Step2 } from "./Step2";
import { Step3 } from "./Step3";
import { useStepStore } from "@/store/steps";

const Indicator = ({ steps, current }: { steps: string[]; current: number }) => {
  return (
    <Box sx={{ display: "grid", gap: 5, gridTemplateColumns: `repeat(${steps.length}, 1fr)`, p: 5 }}>
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
        p: 5,
        pt: 0,
        pb: 2,
        overflow: "hidden",
        overflowY: "auto",
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
  const { current, steps } = useStepStore();

  return (
    <Box sx={{ position: "relative", flex: 1, display: "grid", placeItems: "center", minHeight: 0 }}>
      <Paper sx={{ borderRadius: 5, width: 0.8, height: 1, display: "flex", flexDirection: "column" }}>
        <Indicator steps={steps} current={current} />
        <Box sx={{ position: "relative", flex: 1, width: 1, overflow: "hidden" }}>
          {[Step1, Step2, Step3].map((StepComponent, index) => (
            <StepWrapper key={index} stepIndex={index} currentIndex={current}>
              <StepComponent />
            </StepWrapper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export { Body };
