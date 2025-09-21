import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { createClientBridge, createHostBridge } from "./native/bridge";
import { TestClient } from "./native-test/client";
import { TestServer } from "./native-test/server";

Menu.setApplicationMenu(null);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
    backgroundColor: "#202020",
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.openDevTools();

  ipcMain.on("bridge.start.host", (event, port) => {
    createHostBridge(mainWindow, port);
  });

  ipcMain.on("bridge.start.client", (event, port) => {
    createClientBridge(mainWindow, port);
  });

  ipcMain.on("test.server", () => {
    const server = new TestServer();
    server.start();
  });

  ipcMain.on("test.client", () => {
    const client = new TestClient();
    client.connect();
  });
};

// 不打算支援 macOS
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
