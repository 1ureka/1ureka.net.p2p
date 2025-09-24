import { useState } from "react";
import { LayoutBox, LayoutButton } from "@/components-lib/Layout";
import { EnumState, NumberState } from "@/components-lib/Prop";

enum Mode {
  ADD = "ADD",
  SUB = "SUB",
  MUL = "MUL",
}

const App = () => {
  const [mode, setMode] = useState<Mode>(Mode.ADD);
  const [value, setValue] = useState(0);

  return (
    <LayoutBox sx={{ width: 450, margin: "auto", mt: 5 }}>
      <EnumState
        id="mode"
        value={mode}
        onChange={(newMode) => setMode(newMode)}
        items={[
          { value: Mode.ADD, label: "添加" },
          { value: Mode.SUB, label: "Sub" },
          { value: Mode.MUL, label: "Mul" },
        ]}
      />

      <NumberState value={value} onChange={(newValue) => setValue(newValue)} />

      <LayoutButton onClick={() => alert(`Current mode: ${mode}`)}>Show Mode</LayoutButton>
    </LayoutBox>
  );
};

export { App };
