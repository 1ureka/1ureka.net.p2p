import os from "node:os";
import path from "node:path";
import { inspect } from "node:util";
import started from "electron-squirrel-startup";

import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { createAdapterService } from "@/adapter/adapter-service";
import { IPCChannel } from "@/ipc";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) app.quit();

Menu.setApplicationMenu(null);
declare module "electron" {
  interface BrowserWindow {
    adapter?: "host" | "client";
  }
}

// -----------------------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    minWidth: 850,
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
};

export const getWindow = () => {
  if (!mainWindow) throw new Error("Main window is not created yet.");

  return mainWindow;
};

// -----------------------------------------------------------------------------------------

const handleReady = () => {
  createWindow();
  createAdapterService();

  ipcMain.handle(IPCChannel.OSInfo, () => {
    return os.hostname();
  });

  ipcMain.on(IPCChannel.DeveloperTools, () => {
    const win = getWindow();
    if (!win.webContents.isDevToolsOpened()) {
      win.webContents.openDevTools();
    }
  });

  ipcMain.handle(IPCChannel.PrettyFormat, async (_, data: unknown) => {
    return inspect(data, { depth: 3, colors: false });
  });
};

const handleWindowAllClosed = () => {
  app.quit();
};

// 不打算支援 macOS
app.on("ready", handleReady);
app.on("window-all-closed", handleWindowAllClosed);
