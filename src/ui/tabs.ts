import { create } from "zustand";

type Page = "launch" | "overview" | "events" | "metrics";
type Tab = { label: string; value: string; disabled: boolean };

const defaultTabs: Tab[] = [
  { label: "Overview", value: "overview", disabled: false },
  { label: "Events", value: "events", disabled: true },
  { label: "Metrics", value: "metrics", disabled: true },
];

interface TabsState {
  tab: Tab["value"];
  tabs: Tab[];
  setTab: (tab: Tab["value"]) => void;

  page: Page;
  launch: (launch: boolean) => void;
}

export const useTabs = create<TabsState>((set) => ({
  tab: "overview",
  tabs: [...defaultTabs],
  setTab: (tab) => set({ tab }),

  page: "launch",
  launch: (launch) => {
    const page = launch ? "overview" : "launch";
    const tab = "overview";
    const tabs = launch ? [...defaultTabs.map((tab) => ({ ...tab, disabled: false }))] : [...defaultTabs];
    set(() => ({ page, tab, tabs }));
  },
}));
