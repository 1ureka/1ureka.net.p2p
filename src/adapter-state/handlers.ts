import { IPCChannel } from "@/ipc";
import type { SocketPair } from "@/adapter/ip";
import type { Rules } from "@/adapter/adapter-host";

const handleCreateMapping = async (map: SocketPair) => {
  const id = await window.electron.request(IPCChannel.AdapterCreateMapping, map);
  if (!id) throw new Error("Failed to create mapping");
};

const handleRemoveMapping = async (id: string) => {
  await window.electron.request(IPCChannel.AdapterRemoveMapping, id);
};

const handleChangeRules = async (rules: Rules) => {
  const success = await window.electron.request(IPCChannel.AdapterChangeRules, rules);
  if (!success) throw new Error("Failed to change rules");
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

export { handleCreateMapping, handleRemoveMapping, handleChangeRules };
export { handleStartHostAdapter, handleStartClientAdapter, handleStopAdapter };
