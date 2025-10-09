import { ipcMain } from "electron";
import { getWindow } from "@/main";
import { createReporter, reportClose, reportInstance } from "@/adapter-state/report";
import { createHostAdapter } from "@/adapter/adapter-host";
import { createClientAdapter } from "@/adapter/adapter-client";
import { IPCChannel } from "@/ipc";

const createAdapterService = () => {
  const win = getWindow();
  ipcMain.removeHandler(IPCChannel.AdapterStartHost);
  ipcMain.removeHandler(IPCChannel.AdapterStartClient);

  // ------------------------------------------------------------------------------

  ipcMain.handle(IPCChannel.AdapterStartHost, () => {
    const reporter = createReporter("Host");

    if (win.adapter) {
      reporter.reportWarn({ message: "Adapter is already running, ignoring start request." });
      return false;
    }

    win.adapter = "host";
    reportInstance({ instance: "host" });
    reporter.reportLog({ message: "Starting host adapter..." });

    const handlers = createHostAdapter((packet) => win.webContents.send(IPCChannel.FromTCP, packet));
    const { handlePacketFromRTC, handleClose, handleChangeRules } = handlers;

    ipcMain.on(IPCChannel.FromRTC, handlePacketFromRTC);
    ipcMain.handle(IPCChannel.AdapterChangeRules, handleChangeRules);

    ipcMain.handleOnce(IPCChannel.AdapterStop, () => {
      ipcMain.off(IPCChannel.FromRTC, handlePacketFromRTC);
      ipcMain.removeHandler(IPCChannel.AdapterChangeRules);

      handleClose();
      win.adapter = undefined;

      reportClose();
      reporter.reportLog({ message: "Adapter stopped successfully." });
    });

    return true;
  });

  // ------------------------------------------------------------------------------

  ipcMain.handle(IPCChannel.AdapterStartClient, () => {
    const reporter = createReporter("Client");

    if (win.adapter) {
      reporter.reportWarn({ message: "Adapter is already running, ignoring start request." });
      return false;
    }

    win.adapter = "client";
    reportInstance({ instance: "client" });
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

      reportClose();
      reporter.reportLog({ message: "Adapter stopped successfully." });
    });

    return true;
  });
};

export { createAdapterService };
