import { create } from "zustand";

type PageEntry = { label: string; value: string; disabled: boolean };
const defaultPages: PageEntry[] = [
  { label: "Overview", value: "overview", disabled: false },
  { label: "Events", value: "events", disabled: false },
  { label: "Metrics", value: "metrics", disabled: true },
];

type Page = (typeof defaultPages)[number]["value"];

function togglePage(pages: PageEntry[], page: Page, active: boolean): PageEntry[] {
  return pages.map((p) => (p.value === page ? { ...p, disabled: !active } : p));
}

interface TabsState {
  tab: Page;
  pages: PageEntry[];
  setTab: (tab: Page) => void;
  setPageActive: (page: Page, active: boolean) => void;
}

export const useTabs = create<TabsState>((set) => ({
  tab: "overview",
  pages: [...defaultPages],
  setTab: (tab) => set({ tab }),
  setPageActive: (page, active) => set((prev) => ({ pages: togglePage(prev.pages, page, active) })),
}));
