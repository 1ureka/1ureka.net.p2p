import { app, BrowserWindow, Menu } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

Menu.setApplicationMenu(null);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
    backgroundColor: "#202020",
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  //   mainWindow.webContents.openDevTools();

  // 等待前端傳來RTC連線成功通知後，根據使用者選擇的 host/client 角色，呼叫 createHostBridge 或 createClientBridge
  // 並且啟動 testServer 或 testClient
};

// 不打算支援 macOS
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
