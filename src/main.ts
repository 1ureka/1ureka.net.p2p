import os from "node:os";
import path from "node:path";
import started from "electron-squirrel-startup";

import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { createHostAdapter } from "@/adapter/adapter-host";
import { createClientAdapter } from "@/adapter/adapter-client";
import { IPCChannel } from "@/ipc";

Menu.setApplicationMenu(null);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
    backgroundColor: "#3C3C3C",
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  //   mainWindow.webContents.openDevTools();

  ipcMain.on(IPCChannel.AdapterStart, (_, port, role) => {
    if (role === "host") {
      createHostAdapter(mainWindow, port);
    }
    if (role === "client") {
      createClientAdapter(mainWindow, port);
    }
  });

  ipcMain.handle(IPCChannel.OSInfo, () => {
    return os.hostname();
  });
};

// 不打算支援 macOS
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
