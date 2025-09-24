import { ButtonBase, Input, Typography } from "@mui/material";
import { LayoutBox, LayoutRow } from "./Layout";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { theme } from "@/renderer";
import { ellipsisSx, transition } from "@/components/utils";

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
  value: number;
  onChange: (value: number) => void;
};

const NumberProperty = ({ value, onChange }: NumberProps) => {
  return (
    <Input
      value={value}
      onChange={(e) => {
        const value = Number(e.target.value);
        onChange(value);
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

export { EnumProperty, NumberProperty };
