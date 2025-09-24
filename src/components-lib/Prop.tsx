import { ButtonBase, Input, Typography } from "@mui/material";
import { LayoutBox, LayoutRow } from "./Layout";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { theme } from "@/renderer";
import { transition } from "@/components/utils";

type EnumStateProps<T extends string> = {
  id: string;
  value: T;
  onChange: (newValue: T) => void;
  items: { value: T; label: string }[];
};

const EnumState = <T extends string>({ id, value, onChange, items }: EnumStateProps<T>) => {
  return (
    <LayoutBox sx={{ p: 0.5 }}>
      <LayoutRow sx={{ gap: 0.5 }}>
        {items.map((item) => (
          <ButtonBase
            key={item.value}
            onClick={() => onChange(item.value)}
            sx={{ py: 1, borderRadius: 1, "&:hover": { bgcolor: "action.hover" }, transition }}
          >
            <Typography variant="button">{item.label}</Typography>
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

type NumberStateProps = {
  value: number;
  onChange: (newValue: number) => void;
};

const NumberState = ({ value, onChange }: NumberStateProps) => {
  return (
    <Input
      value={value}
      onChange={(e) => {
        const newValue = Number(e.target.value);
        onChange(newValue);
      }}
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
        },
      }}
    />
  );
};

export { EnumState, NumberState };
