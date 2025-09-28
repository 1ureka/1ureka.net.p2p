/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSession, joinSession, pollingSession, sendSignal } from "./session-utils";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.electron
const mockElectron = {
  request: vi.fn(),
};

// Mock window object for Node.js test environment
Object.defineProperty(globalThis, "window", {
  value: {
    electron: mockElectron,
  },
  writable: true,
});

describe("Session Utils 工具測試", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectron.request.mockResolvedValue("test-hostname");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("建立會話", () => {
    it("成功建立會話", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-hostname",
        client: "",
        status: "waiting",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await createSession();

      expect(mockElectron.request).toHaveBeenCalledWith("os.info");
      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: "test-hostname" }),
      });
      expect(result).toEqual(mockSession);
    });

    it("IPC 回傳無效主機名時拋出錯誤", async () => {
      mockElectron.request.mockResolvedValueOnce("");

      await expect(createSession()).rejects.toThrow("Invalid hostname from IPC");
    });

    it("IPC 回傳非字串時拋出錯誤", async () => {
      mockElectron.request.mockResolvedValueOnce(null);

      await expect(createSession()).rejects.toThrow("Invalid hostname from IPC");
    });

    it("回應不正常時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(createSession()).rejects.toThrow("Failed to create session, status code: 400");
    });

    it("回應資料無效時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: "data" }),
      });

      await expect(createSession()).rejects.toThrow();
    });
  });

  describe("加入會話", () => {
    it("成功加入會話", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "test-hostname",
        status: "joined",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await joinSession("test-session-id");

      expect(mockElectron.request).toHaveBeenCalledWith("os.info");
      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: "test-hostname" }),
      });
      expect(result).toEqual(mockSession);
    });

    it("IPC 回傳無效主機名時拋出錯誤", async () => {
      mockElectron.request.mockResolvedValueOnce("   ");

      await expect(joinSession("test-session-id")).rejects.toThrow("Invalid hostname from IPC");
    });

    it("回應不正常時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(joinSession("test-session-id")).rejects.toThrow("Failed to join session, status code: 404");
    });
  });

  describe("輪詢會話", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("成功輪詢會話資料等待加入", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "test-client",
        status: "joined",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {},
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockSession),
      });

      const generator = pollingSession("test-session-id", "join");

      // 模擬 100ms 延遲
      const resultPromise = generator.next();
      vi.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id?for=join");
      expect(result.value).toEqual(mockSession);
    });

    it("成功輪詢會話資料等待 offer", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "test-client",
        status: "signaling",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {
          offer: {
            sdp: "test-offer-sdp",
            candidate: ["candidate1", "candidate2"],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockSession),
      });

      const generator = pollingSession("test-session-id", "offer");

      const resultPromise = generator.next();
      vi.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id?for=offer");
      expect(result.value).toEqual(mockSession);
    });

    it("處理 404 狀態並拋出 TTL 錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
      });

      const generator = pollingSession("test-session-id", "join");

      const resultPromise = generator.next();
      vi.advanceTimersByTime(100);

      await expect(resultPromise).rejects.toThrow("Session has been deleted due to TTL");
    });

    it("處理無效資料格式", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ invalid: "data" }),
      });

      const generator = pollingSession("test-session-id", "join");

      const resultPromise = generator.next();
      vi.advanceTimersByTime(100);

      await expect(resultPromise).rejects.toThrow();
    });
  });

  describe("發送信號", () => {
    it("成功發送 offer 信號", async () => {
      const signalData = {
        type: "offer" as const,
        sdp: "test-offer-sdp",
        candidate: ["candidate1", "candidate2"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await sendSignal("test-session-id", signalData);

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signalData),
      });
    });

    it("成功發送 answer 信號", async () => {
      const signalData = {
        type: "answer" as const,
        sdp: "test-answer-sdp",
        candidate: ["candidate1"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await sendSignal("test-session-id", signalData);

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signalData),
      });
    });

    it("回應不正常時拋出錯誤", async () => {
      const signalData = {
        type: "offer" as const,
        sdp: "test-sdp",
        candidate: ["candidate1"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(sendSignal("test-session-id", signalData)).rejects.toThrow("Failed to send offer, status code: 400");
    });

    it("無效信號資料時拋出錯誤", async () => {
      const invalidData = {
        type: "invalid" as any,
        sdp: "test-sdp",
        candidate: ["candidate1"],
      };

      await expect(sendSignal("test-session-id", invalidData)).rejects.toThrow();
    });
  });
});
