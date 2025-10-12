import { create } from "zustand";

type Tab = "overview" | "events";
type TabEntry = { label: string; value: Tab; disabled: boolean };
type TabsState = { tab: Tab; setTab: (tab: Tab) => void };

const useTab = create<TabsState>((set) => ({
  tab: "overview",
  setTab: (tab: Tab) => set({ tab }),
}));

export { useTab, type TabEntry };
