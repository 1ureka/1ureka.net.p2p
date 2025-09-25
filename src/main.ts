import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { createBridge } from "./native/bridge";

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

  ipcMain.on("bridge.start.host", (event, port) => {
    createBridge(mainWindow, port, "host");
  });

  ipcMain.on("bridge.start.client", (event, port) => {
    createBridge(mainWindow, port, "client");
  });
};

// 不打算支援 macOS
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
