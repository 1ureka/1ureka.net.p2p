import { ipcMain } from "electron";
import { getWindow } from "@/main";
import { createReporter, clearHistory } from "@/adapter-state/report";
import { createHostAdapter } from "@/adapter/adapter-host";
import { createClientAdapter } from "@/adapter/adapter-client";
import { IPCChannel } from "@/ipc";

const createAdapterService = () => {
  const win = getWindow();
  ipcMain.removeAllListeners();

  // ------------------------------------------------------------------------------

  ipcMain.on(IPCChannel.AdapterStartHost, () => {
    const reporter = createReporter("Host");

    if (win.adapter) {
      reporter.reportWarn({ message: "Adapter is already running, ignoring start request." });
      return;
    }

    win.adapter = "host";
    clearHistory();
    reporter.reportLog({ message: "Starting host adapter..." });

    const handlers = createHostAdapter((packet) => win.webContents.send(IPCChannel.FromTCP, packet));
    const { handlePacketFromRTC, handleClose, handleCreateRule, handleRemoveRule } = handlers;

    ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
    ipcMain.handle(IPCChannel.AdapterCreateRule, handleCreateRule);
    ipcMain.handle(IPCChannel.AdapterRemoveRule, handleRemoveRule);

    ipcMain.handleOnce(IPCChannel.AdapterStop, () => {
      ipcMain.off(IPCChannel.FromRTC, handlePacketFromRTC);
      ipcMain.removeHandler(IPCChannel.AdapterCreateRule);
      ipcMain.removeHandler(IPCChannel.AdapterRemoveRule);
      handleClose();
      win.adapter = undefined;
      reporter.reportLog({ message: "Host adapter stopped." });
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
    reporter.reportLog({ message: "Starting client adapter..." });

    const handlers = createClientAdapter((packet) => win.webContents.send(IPCChannel.FromTCP, packet));
    const { handlePacketFromRTC, handleClose, handleCreateMapping, handleRemoveMapping } = handlers;

    ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
    ipcMain.handle(IPCChannel.AdapterCreateMapping, handleCreateMapping);
    ipcMain.handle(IPCChannel.AdapterRemoveMapping, handleRemoveMapping);

    ipcMain.handleOnce(IPCChannel.AdapterStop, () => {
      ipcMain.off(IPCChannel.FromRTC, handlePacketFromRTC);
      ipcMain.removeHandler(IPCChannel.AdapterCreateMapping);
      ipcMain.removeHandler(IPCChannel.AdapterRemoveMapping);
      handleClose();
      win.adapter = undefined;
      reporter.reportLog({ message: "Client adapter closed." });
    });
  });
};

export { createAdapterService };
