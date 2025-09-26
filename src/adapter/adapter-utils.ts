import net from "net";
import { createReporter, getLock } from "@/adapter/report";
import type { BrowserWindow } from "electron";

function checkLock(win: BrowserWindow): boolean {
  const { reportWarn, reportStatus, clearHistory } = createReporter("Adapter", win);
  clearHistory();

  if (getLock()) {
    reportStatus("failed");
    reportWarn({ message: "Adapter is already established or connecting, ignoring duplicate attempt" });
    return false;
  }

  return true;
}

function tryConnect(win: BrowserWindow, port: number): Promise<boolean> {
  const { reportLog, reportError, reportStatus } = createReporter("Adapter", win);

  // 驗證 port 範圍
  if (port < 0 || port > 65535 || !Number.isInteger(port)) {
    reportStatus("failed");
    reportError({ message: `Invalid port number: ${port}. Port must be between 0 and 65535` });
    return Promise.resolve(false);
  }

  const socket = net.connect(port, "::").setTimeout(1000);

  return new Promise((resolve) => {
    socket.on("error", (error) => {
      socket.destroy();
      reportStatus("failed");
      reportError({ message: `Failed to connect to TCP server at localhost:${port}`, data: { error } });
      resolve(false);
    });

    socket.on("timeout", () => {
      socket.destroy();
      reportStatus("failed");
      reportError({ message: `Connection to TCP server at localhost:${port} timed out` });
      resolve(false);
    });

    socket.on("connect", () => {
      socket.destroy();
      reportStatus("connected");
      reportLog({ message: `Successfully connected to TCP server at localhost:${port}` });
      resolve(true);
    });
  });
}

function tryListen(win: BrowserWindow, port: number): Promise<net.Server | null> {
  const { reportLog, reportError, reportStatus } = createReporter("Adapter", win);
  const server = net.createServer();

  // 驗證 port 範圍
  if (port < 0 || port > 65535 || !Number.isInteger(port)) {
    reportStatus("failed");
    reportError({ message: `Invalid port number: ${port}. Port must be between 0 and 65535` });
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    // 設置超時，如果 1 秒內無法監聽則認為失敗
    const timeout = setTimeout(() => {
      server.close();
      reportStatus("failed");
      reportError({ message: `Failed to listen on TCP server at localhost:${port} - timeout` });
      resolve(null);
    }, 1000);

    server.on("error", (error) => {
      clearTimeout(timeout);
      server.close();
      reportStatus("failed");
      reportError({ message: `Failed to listen on TCP server at localhost:${port}`, data: { error } });
      resolve(null);
    });

    server.on("listening", () => {
      clearTimeout(timeout);
      reportStatus("connected");
      reportLog({ message: `Successfully listened on TCP server at localhost:${port}` });
      resolve(server);
    });

    server.listen(port, "::");
  });
}

export { checkLock, tryConnect, tryListen };
