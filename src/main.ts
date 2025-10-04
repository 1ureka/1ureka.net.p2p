import os from "node:os";
import path from "node:path";
import started from "electron-squirrel-startup";

import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { createHostAdapter } from "@/adapter/adapter-host";
import { createClientAdapter } from "@/adapter/adapter-client";
import { createReporter } from "@/adapter/report";
import { IPCChannel } from "@/ipc";

Menu.setApplicationMenu(null);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1250,
    height: 800,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
    backgroundColor: "#212830",
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  //   mainWindow.webContents.openDevTools();

  return mainWindow;
};

const handleReady = () => {
  const mainWindow = createWindow();

  const { reportLog, reportError } = createReporter("main", mainWindow);
  let lock = false;

  ipcMain.on(IPCChannel.AdapterStartHost, () => {
    if (lock) return;
    lock = true;
    createHostAdapter(mainWindow);
  });

  ipcMain.on(IPCChannel.AdapterStartClient, async (_, port) => {
    if (lock) return;
    lock = true;
    const { createMapping } = createClientAdapter(mainWindow);
    try {
      await createMapping({ srcAddr: "::", srcPort: 3000, dstAddr: "::", dstPort: port });
    } catch (error) {
      reportError({ message: "Failed to create initial mapping", data: { error } });
    }
  });

  ipcMain.handle(IPCChannel.OSInfo, () => {
    reportLog({ message: "Getting OS hostname" });
    return os.hostname();
  });
};

const handleWindowAllClosed = () => {
  app.quit();
};

// 不打算支援 macOS
app.on("ready", handleReady);
app.on("window-all-closed", handleWindowAllClosed);
