import { create } from "zustand";

type Role = "host" | "client";
type Tab = "overview" | "events" | "metrics";
type TabEntry = { label: string; value: Tab; disabled: boolean };

const defaultTabs: TabEntry[] = [
  { label: "Overview", value: "overview", disabled: false },
  { label: "Events", value: "events", disabled: true },
  { label: "Metrics", value: "metrics", disabled: true },
];

interface TabsState {
  role: Role | null;
  tab: Tab;
  tabs: TabEntry[];
}

const useTabs = create<TabsState>((set) => ({
  role: null,
  tab: "overview",
  tabs: [...defaultTabs],
}));

const handleCreateSession = () => {
  // TODO: 在這裡呼叫後端
  useTabs.setState({ role: "host", tab: "overview", tabs: defaultTabs.map((t) => ({ ...t, disabled: false })) });
};

const handleJoinSession = () => {
  // TODO: 在這裡呼叫後端
  useTabs.setState({ role: "client", tab: "overview", tabs: defaultTabs.map((t) => ({ ...t, disabled: false })) });
};

const handleLeaveSession = () => {
  // TODO: 在這裡呼叫後端
  useTabs.setState({ role: null, tab: "overview", tabs: [...defaultTabs] });
};

const handleChangeTab = (tab: Tab) => {
  const role = useTabs.getState().role;
  if (!role && tab !== "overview") return;
  useTabs.setState({ tab });
};

export { useTabs, handleCreateSession, handleJoinSession, handleLeaveSession, handleChangeTab };
