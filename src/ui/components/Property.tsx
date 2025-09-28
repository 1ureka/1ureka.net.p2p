import { useRef, useCallback, useEffect } from "react";
import { Box, ButtonBase, Input, type InputProps, Typography } from "@mui/material";
import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import { motion } from "motion/react";

import { theme } from "@/ui/renderer";
import { LayoutBox, LayoutRow } from "@/ui/components/Layout";

const transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
const ellipsisSx = {
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "pre-wrap",
} as const;

type EnumProps<T extends string> = {
  id: string;
  value: T;
  onChange: (newValue: T) => void;
  items: { value: T; label: string }[];
};

const EnumProperty = <T extends string>({ id, value, onChange, items }: EnumProps<T>) => {
  return (
    <LayoutBox sx={{ p: 0.5 }}>
      <LayoutRow sx={{ gap: 0.5 }}>
        {items.map((item) => (
          <ButtonBase
            key={item.value}
            onClick={() => onChange(item.value)}
            sx={{ py: 1, borderRadius: 1, "&:hover": { bgcolor: "action.hover" }, transition }}
          >
            <Typography variant="button" sx={ellipsisSx}>
              {item.label}
            </Typography>
            {item.value === value && (
              <motion.div
                layout
                layoutId={id}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: theme.shape.borderRadius,
                  background: theme.palette.action.selected,
                  pointerEvents: "none",
                }}
              />
            )}
          </ButtonBase>
        ))}
      </LayoutRow>
    </LayoutBox>
  );
};

type NumberProps = {
  step?: number;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
};

const NumberProperty = ({ value, onChange, ...props }: NumberProps) => {
  const { step = 1, min = 0, max = 65535 } = props;
  const dragFlag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);
  const mousedownTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clampValue = useCallback(
    (val: number) => {
      let newVal = val;

      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;

      if (step > 0) {
        const base = min ?? 0; // 以 min 為基準對齊，沒有就從 0
        newVal = Math.round((newVal - base) / step) * step + base;
      }

      return newVal;
    },
    [min, max, step]
  );

  const handleIncrement = useCallback(() => {
    const newValue = clampValue(value + step);
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = clampValue(value - step);
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (e.button !== 0) return; // 只處理左鍵

      mousedownTimeout.current = setTimeout(() => {
        dragFlag.current = true; // 開始允許拖曳
        dragStartX.current = e.clientX;
        dragStartValue.current = value;
        document.body.style.cursor = "ew-resize";
      }, 100);
    },
    [value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragFlag.current) return;

      const deltaX = e.clientX - dragStartX.current;
      const sensitivity = e.shiftKey ? 0.1 : 1; // shift 鍵微調
      const deltaValue = (deltaX / 10) * step * sensitivity;
      const newValue = clampValue(dragStartValue.current + deltaValue);

      onChange(newValue);
    },
    [step, clampValue, onChange]
  );

  const handleMouseUp = useCallback(() => {
    if (mousedownTimeout.current) {
      clearTimeout(mousedownTimeout.current);
      mousedownTimeout.current = null;
      inputRef.current?.focus();
    }
    dragFlag.current = false;
    document.body.style.cursor = "";
  }, []);

  // 綁定全域滑鼠事件
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onChange(0);
      return;
    }

    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(clampValue(newValue));
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Input
        inputRef={inputRef}
        value={value}
        onChange={handleInputChange}
        onMouseDown={handleMouseDown}
        size="small"
        fullWidth
        sx={{
          "& .MuiInputBase-input": {
            fontVariantNumeric: "tabular-nums",
            textAlign: "center",
            p: 0.75,
            bgcolor: "background.paper",
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,
            border: "2px solid",
            borderColor: "divider",
            cursor: "ew-resize",
          },
        }}
      />

      <ButtonBase
        onClick={handleDecrement}
        sx={{
          position: "absolute",
          inset: "4px auto 4px 4px",
          borderRadius: 1,
          p: 0.5,
          "&:hover": { bgcolor: "divider" },
          transition,
        }}
      >
        <ArrowLeftRoundedIcon />
      </ButtonBase>
      <ButtonBase
        onClick={handleIncrement}
        sx={{
          position: "absolute",
          inset: "4px 4px 4px auto",
          borderRadius: 1,
          p: 0.5,
          "&:hover": { bgcolor: "divider" },
          transition,
        }}
      >
        <ArrowRightRoundedIcon />
      </ButtonBase>
    </Box>
  );
};

const TextProperty = ({ sx, ...props }: InputProps) => {
  return (
    <Input
      size="small"
      fullWidth
      sx={{
        "& .MuiInputBase-input": {
          textAlign: "center",
          p: 0.75,
          bgcolor: "background.paper",
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
          border: "2px solid",
          borderColor: "divider",
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export { transition, ellipsisSx };
export { EnumProperty, NumberProperty, TextProperty };
