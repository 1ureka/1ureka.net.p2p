import { useState } from "react";
import { LayoutBox, LayoutButton, LayoutRow, LayoutText, LayoutTitle } from "@/components-lib/Layout";
import { EnumProperty, NumberProperty } from "@/components-lib/Property";

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
      <LayoutRow>
        <LayoutTitle>Pick role</LayoutTitle>
      </LayoutRow>
      <LayoutText>This is a simple app demonstrating the use of custom properties and layout components.</LayoutText>

      <EnumProperty
        id="mode"
        value={mode}
        onChange={(newMode) => setMode(newMode)}
        items={[
          { value: Mode.ADD, label: "添加" },
          { value: Mode.SUB, label: "Sub" },
          { value: Mode.MUL, label: "Mul" },
        ]}
      />

      <NumberProperty value={value} onChange={(newValue) => setValue(newValue)} />

      <LayoutButton onClick={() => alert(`Current mode: ${mode}`)}>Show Mode</LayoutButton>
    </LayoutBox>
  );
};

export { App };
