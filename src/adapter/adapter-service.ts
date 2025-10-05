import { ipcMain } from "electron";
import { getWindow } from "@/main";
import { createReporter, clearHistory } from "@/adapter/report";
import { createHostAdapter } from "@/adapter/adapter-host";
import { createClientAdapter } from "@/adapter/adapter-client";
import { IPCChannel } from "@/ipc";

const createAdapterService = () => {
  const win = getWindow();

  // ------------------------------------------------------------------------------

  ipcMain.on(IPCChannel.AdapterStartHost, () => {
    const reporter = createReporter("Host");

    if (win.adapter) {
      reporter.reportWarn({ message: "Adapter is already running, ignoring start request." });
      return;
    }

    win.adapter = "host";
    clearHistory();

    const handlers = createHostAdapter(win);
    const { handlePacketFromRTC, handleClose, handleCreateRule, handleRemoveRule } = handlers;

    ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
    ipcMain.handle(IPCChannel.AdapterCreateRule, handleCreateRule);
    ipcMain.handle(IPCChannel.AdapterRemoveRule, handleRemoveRule);

    ipcMain.once(IPCChannel.AdapterStop, () => {
      ipcMain.off(IPCChannel.FromRTC, handlePacketFromRTC);
      ipcMain.removeHandler(IPCChannel.AdapterCreateRule);
      ipcMain.removeHandler(IPCChannel.AdapterRemoveRule);
      handleClose();
      win.adapter = undefined;
    });
  });

  // ------------------------------------------------------------------------------

  ipcMain.on(IPCChannel.AdapterStartClient, () => {
    const reporter = createReporter("Client");

    if (win.adapter) {
      reporter.reportWarn({ message: "Adapter is already running, ignoring start request." });
      return;
    }

    win.adapter = "client";
    clearHistory();

    const handlers = createClientAdapter(win);
    const { handlePacketFromRTC, handleClose, handleCreateMapping, handleRemoveMapping } = handlers;

    ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
    ipcMain.handle(IPCChannel.AdapterCreateMapping, handleCreateMapping);
    ipcMain.handle(IPCChannel.AdapterRemoveMapping, handleRemoveMapping);

    ipcMain.once(IPCChannel.AdapterStop, () => {
      ipcMain.off(IPCChannel.FromRTC, handlePacketFromRTC);
      ipcMain.removeHandler(IPCChannel.AdapterCreateMapping);
      ipcMain.removeHandler(IPCChannel.AdapterRemoveMapping);
      handleClose();
      win.adapter = undefined;
    });
  });
};

export { createAdapterService };
