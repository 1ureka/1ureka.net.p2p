import { IPCChannel } from "@/ipc";
import { useAdapter } from "@/adapter-state/store";
import type { SocketPair } from "@/adapter/ip";

const handleCreateMapping = async (map: SocketPair) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateMapping, map);
  if (!id) return null;
  useAdapter.setState((state) => {
    const mappings = new Map(state.mappings);
    mappings.set(id, { map, createdAt: Date.now() });
    return { ...state, mappings };
  });
  return id as string;
};

const handleRemoveMapping = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveMapping, id);
  useAdapter.setState((state) => {
    const mappings = new Map(state.mappings);
    mappings.delete(id);
    return { ...state, mappings };
  });
};

const handleCreateRule = async (pattern: string) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateRule, pattern);
  if (!id) return null;
  useAdapter.setState((state) => {
    const rules = new Map(state.rules);
    rules.set(id, { pattern, createdAt: Date.now() });
    return { ...state, rules };
  });
  return id as string;
};

const handleRemoveRule = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveRule, id);
  useAdapter.setState((state) => {
    const rules = new Map(state.rules);
    rules.delete(id);
    return { ...state, rules };
  });
};

export { handleCreateMapping, handleRemoveMapping, handleCreateRule, handleRemoveRule };
