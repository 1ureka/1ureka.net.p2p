import { tryConnect, tryListen } from "../native/bridge-utils";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import net from "net";

// Mock BrowserWindow
const mockBrowserWindow = {
  webContents: {
    send: vi.fn(),
  },
} as any;

// Mock createReporter
vi.mock("../native/bridge-report", () => ({
  createReporter: vi.fn(() => ({
    reportLog: vi.fn(),
    reportError: vi.fn(),
    reportWarn: vi.fn(),
    reportStatus: vi.fn(),
    clearHistory: vi.fn(),
  })),
  getLock: vi.fn(() => false),
}));

// Helper function to get a free port
async function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

describe("Bridge Utils Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 清理可能存在的 server
    vi.clearAllTimers();
  });

  describe("tryConnect Tests", () => {
    test("成功連接到存在的 TCP 伺服器", async () => {
      // 建立一個測試伺服器
      const testServer = net.createServer();
      const testPort = 12345;

      await new Promise<void>((resolve, reject) => {
        testServer.listen(testPort, "127.0.0.1", () => {
          resolve();
        });
        testServer.on("error", reject);
      });

      try {
        const result = await tryConnect(mockBrowserWindow, testPort);
        expect(result).toBe(true);
      } finally {
        testServer.close();
      }
    });

    test("連接不存在的 TCP 伺服器應該失敗", async () => {
      const nonExistentPort = 54321;
      const result = await tryConnect(mockBrowserWindow, nonExistentPort);
      expect(result).toBe(false);
    });

    test("連接超時應該失敗", async () => {
      // 使用一個會導致超時的情況
      // 使用保留的 port 範圍但不會有服務監聽
      const timeoutPort = 1;
      const result = await tryConnect(mockBrowserWindow, timeoutPort);
      expect(result).toBe(false);
    }, 10000);

    test("無效的 port 應該失敗", async () => {
      const invalidPort = 0;
      const result = await tryConnect(mockBrowserWindow, invalidPort);
      expect(result).toBe(false);
    });

    test("連接被拒絕應該失敗", async () => {
      // 嘗試連接一個已關閉的 port
      const closedPort = 65535;
      const result = await tryConnect(mockBrowserWindow, closedPort);
      expect(result).toBe(false);
    });
  });

  describe("tryListen Tests", () => {
    test("成功監聽可用的 port", async () => {
      const availablePort = await getFreePort();
      const server = await tryListen(mockBrowserWindow, availablePort);

      expect(server).not.toBeNull();
      expect(server).toBeInstanceOf(net.Server);

      if (server) {
        // 驗證伺服器正在監聽
        expect(server.listening).toBe(true);

        // 清理
        server.close();
      }
    });

    test("監聽已被佔用的 port 應該失敗", async () => {
      const busyPort = 34567;

      // 先建立一個伺服器佔用 port
      const existingServer = net.createServer();
      await new Promise<void>((resolve) => {
        existingServer.listen(busyPort, "127.0.0.1", () => {
          resolve();
        });
      });

      try {
        // 嘗試在相同 port 上監聽
        const result = await tryListen(mockBrowserWindow, busyPort);
        expect(result).toBeNull();
      } finally {
        existingServer.close();
      }
    });

    test("監聽無效的 port 應該失敗", async () => {
      const invalidPort = -1;
      const result = await tryListen(mockBrowserWindow, invalidPort);
      expect(result).toBeNull();
    });

    test("監聽超出範圍的 port 應該失敗", async () => {
      const outOfRangePort = 70000;
      const result = await tryListen(mockBrowserWindow, outOfRangePort);
      expect(result).toBeNull();
    });

    test("成功監聽後應該能接受連線", async () => {
      const testPort = await getFreePort();
      const server = await tryListen(mockBrowserWindow, testPort);

      expect(server).not.toBeNull();

      if (server) {
        // 設置連線處理器
        let connectionReceived = false;
        server.on("connection", (socket) => {
          connectionReceived = true;
          socket.end();
        });

        // 建立測試連線
        const client = net.connect(testPort, "127.0.0.1");

        await new Promise<void>((resolve, reject) => {
          client.on("connect", () => {
            client.end();
            resolve();
          });
          client.on("error", reject);
        });

        // 給一點時間讓連線事件觸發
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(connectionReceived).toBe(true);

        // 清理
        server.close();
      }
    });

    test("多個 port 同時監聽", async () => {
      const ports = [await getFreePort(), await getFreePort(), await getFreePort()];
      const servers: (net.Server | null)[] = [];

      try {
        // 同時在多個 port 上監聽
        for (const port of ports) {
          const server = await tryListen(mockBrowserWindow, port);
          servers.push(server);
          expect(server).not.toBeNull();
        }

        // 驗證所有伺服器都在監聽
        servers.forEach((server, index) => {
          if (server) {
            expect(server.listening).toBe(true);
          }
        });
      } finally {
        // 清理所有伺服器
        servers.forEach((server) => {
          if (server) {
            server.close();
          }
        });
      }
    });

    test("監聽然後關閉後應該能重新監聽", async () => {
      const reusePort = await getFreePort();

      // 第一次監聽
      const firstServer = await tryListen(mockBrowserWindow, reusePort);
      expect(firstServer).not.toBeNull();

      if (firstServer) {
        // 關閉第一個伺服器
        firstServer.close();

        // 等待 port 釋放
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 第二次監聽相同 port
        const secondServer = await tryListen(mockBrowserWindow, reusePort);
        expect(secondServer).not.toBeNull();

        if (secondServer) {
          secondServer.close();
        }
      }
    });

    test("監聽 localhost 應該只接受本地連線", async () => {
      const localPort = await getFreePort();
      const server = await tryListen(mockBrowserWindow, localPort);

      expect(server).not.toBeNull();

      if (server) {
        // 驗證伺服器只監聽 127.0.0.1
        const address = server.address();
        expect(address).not.toBeNull();
        if (address && typeof address === "object") {
          expect(address.address).toBe("127.0.0.1");
          expect(address.port).toBe(localPort);
        }

        server.close();
      }
    });
  });

  describe("Integration Tests", () => {
    test("先監聽再連接應該成功", async () => {
      const integrationPort = await getFreePort();

      // 先監聽
      const server = await tryListen(mockBrowserWindow, integrationPort);
      expect(server).not.toBeNull();

      if (server) {
        try {
          // 再連接
          const connectResult = await tryConnect(mockBrowserWindow, integrationPort);
          expect(connectResult).toBe(true);
        } finally {
          server.close();
        }
      }
    });

    test("先連接再監聽應該失敗連接但成功監聽", async () => {
      const integrationPort2 = await getFreePort();

      // 先嘗試連接不存在的服務
      const connectResult = await tryConnect(mockBrowserWindow, integrationPort2);
      expect(connectResult).toBe(false);

      // 再監聽
      const server = await tryListen(mockBrowserWindow, integrationPort2);
      expect(server).not.toBeNull();

      if (server) {
        server.close();
      }
    });

    test("同一 port 不能同時監聽和連接外部服務", async () => {
      const conflictPort = 11111;

      // 建立外部測試伺服器
      const externalServer = net.createServer();
      await new Promise<void>((resolve) => {
        externalServer.listen(conflictPort, "127.0.0.1", () => {
          resolve();
        });
      });

      try {
        // 嘗試在相同 port 監聽應該失敗
        const listenResult = await tryListen(mockBrowserWindow, conflictPort);
        expect(listenResult).toBeNull();

        // 但連接到該 port 應該成功
        const connectResult = await tryConnect(mockBrowserWindow, conflictPort);
        expect(connectResult).toBe(true);
      } finally {
        externalServer.close();
      }
    });

    test("快速連續的連接嘗試", async () => {
      const rapidPort = 22222;

      // 建立測試伺服器
      const testServer = net.createServer();
      await new Promise<void>((resolve) => {
        testServer.listen(rapidPort, "127.0.0.1", () => {
          resolve();
        });
      });

      try {
        // 快速連續的連接嘗試
        const promises = Array(5)
          .fill(null)
          .map(() => tryConnect(mockBrowserWindow, rapidPort));

        const results = await Promise.all(promises);

        // 所有連接都應該成功
        results.forEach((result) => {
          expect(result).toBe(true);
        });
      } finally {
        testServer.close();
      }
    });

    test("網路資源清理測試", async () => {
      const cleanupPort = 33333;
      const servers: net.Server[] = [];

      try {
        // 建立多個伺服器
        for (let i = 0; i < 3; i++) {
          const server = await tryListen(mockBrowserWindow, cleanupPort + i);
          if (server) {
            servers.push(server);
          }
        }

        expect(servers.length).toBe(3);

        // 每個伺服器都應該正在監聽
        servers.forEach((server) => {
          expect(server.listening).toBe(true);
        });
      } finally {
        // 清理所有資源
        servers.forEach((server) => {
          server.close();
        });

        // 驗證所有 port 都已釋放 (通過重新監聽測試)
        for (let i = 0; i < 3; i++) {
          const testServer = await tryListen(mockBrowserWindow, cleanupPort + i);
          expect(testServer).not.toBeNull();
          if (testServer) {
            testServer.close();
          }
        }
      }
    });
  });
});
