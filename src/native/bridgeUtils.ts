import net from "net";
import { createReporter, getLock } from "./bridgeReport";
import type { BrowserWindow } from "electron";

function checkLock(win: BrowserWindow): boolean {
  const { reportWarn, reportStatus, clearHistory } = createReporter("Bridge", win);
  clearHistory();

  if (getLock()) {
    reportStatus("failed");
    reportWarn({ message: "Bridge is already established or connecting, ignoring duplicate attempt" });
    return false;
  }

  return true;
}

function tryConnect(win: BrowserWindow, port: number): Promise<boolean> {
  const { reportLog, reportError, reportStatus } = createReporter("Bridge", win);
  const socket = net.connect(port, "127.0.0.1").setTimeout(1000);

  return new Promise((resolve) => {
    socket.on("error", () => {
      socket.destroy();
      reportStatus("failed");
      reportError({ message: `Failed to connect to TCP server at localhost:${port}` });
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
  const { reportLog, reportError, reportStatus } = createReporter("Bridge", win);
  const server = net.createServer();

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

    server.listen(port, "127.0.0.1");
  });
}

export { checkLock, tryConnect, tryListen };
