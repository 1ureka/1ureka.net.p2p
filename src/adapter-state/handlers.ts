import { IPCChannel } from "@/ipc";
import type { SocketPair } from "@/adapter/ip";

const handleCreateMapping = async (map: SocketPair) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateMapping, map);
  if (!id) throw new Error("Failed to create mapping");
};

const handleRemoveMapping = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveMapping, id);
};

const handleCreateRule = async (pattern: string) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateRule, pattern);
  if (!id) throw new Error("Failed to create rule");
};

const handleRemoveRule = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveRule, id);
};

const handleStartHostAdapter = async () => {
  const success = await window.electron.request(IPCChannel.AdapterStartHost);
  if (!success) throw new Error("Failed to start host adapter");
};

const handleStartClientAdapter = async () => {
  const success = await window.electron.request(IPCChannel.AdapterStartClient);
  if (!success) throw new Error("Failed to start client adapter");
};

const handleStopAdapter = async () => {
  await window.electron.request(IPCChannel.AdapterStop);
};

export { handleCreateMapping, handleRemoveMapping, handleCreateRule, handleRemoveRule };
export { handleStartHostAdapter, handleStartClientAdapter, handleStopAdapter };
