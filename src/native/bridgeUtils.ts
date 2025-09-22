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

const MIN_POOL_SIZE = 10;
const MAX_POOL_SIZE = 50;

function createConnectionPool(win: BrowserWindow, port: number) {
  const { reportLog, reportWarn } = createReporter("ConnectionPool", win);
  const availableSockets: net.Socket[] = [];
  const activeSockets = new Map<number, net.Socket>();

  function getPoolStats() {
    return `Active: ${activeSockets.size}, Available: ${availableSockets.length}`;
  }

  function cleanupSocket(socket: net.Socket) {
    socket.destroy();

    const availIndex = availableSockets.indexOf(socket);
    if (availIndex >= 0) availableSockets.splice(availIndex, 1);

    activeSockets.forEach((s, id) => {
      if (s === socket) activeSockets.delete(id);
    });
  }

  function createSocket(): net.Socket {
    const socket = net.connect(port, "127.0.0.1");

    socket.on("error", () => {
      reportWarn({ message: `TCP socket to localhost:${port} encountered an error and closing` });
      cleanupSocket(socket);
    });

    socket.on("close", () => {
      cleanupSocket(socket); // 避免外部自行 close 時無法更新到 closure 內的 array and map
    });

    return socket;
  }

  function fillSocketPool() {
    while (availableSockets.length < MIN_POOL_SIZE) {
      availableSockets.push(createSocket());
    }
  }

  function getSocket(id: number) {
    reportLog({ message: `Acquiring socket for client ${id}. ${getPoolStats()}` });
    let socket: net.Socket | null = null;
    let status: "HIT" | "MISS" = "MISS";

    if (activeSockets.has(id)) {
      socket = activeSockets.get(id)!;
      status = "HIT";
    } else if (availableSockets.length > 0) {
      socket = availableSockets.pop()!;
      activeSockets.set(id, socket);
    } else if (activeSockets.size < MAX_POOL_SIZE) {
      socket = createSocket();
      activeSockets.set(id, socket);
    }

    fillSocketPool();
    return { socket, status } as const;
  }

  function releaseSocket(id: number) {
    reportLog({ message: `Releasing socket for client ${id}. ${getPoolStats()}` });
    const socket = activeSockets.get(id);
    if (!socket) return;

    cleanupSocket(socket);
    fillSocketPool();
  }

  fillSocketPool();
  reportLog({ message: `Initialized connection pool. ${getPoolStats()}` });

  return { getSocket, releaseSocket };
}

export { checkLock, tryConnect, createConnectionPool };
