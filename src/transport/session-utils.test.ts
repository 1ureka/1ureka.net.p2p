/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSession, joinSession, pollingSession, sendSignal, pollingSignal } from "./session-utils";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Session Utils 工具測試", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("建立會話", () => {
    it("成功建立會話", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "",
        status: "waiting",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await createSession("test-host");

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: "test-host" }),
      });
      expect(result).toEqual(mockSession);
    });

    it("回應不正常時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(createSession("test-host")).rejects.toThrow("Failed to create session, status code: 400");
    });

    it("回應資料無效時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: "data" }),
      });

      await expect(createSession("test-host")).rejects.toThrow();
    });
  });

  describe("加入會話", () => {
    it("成功加入會話", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "test-client",
        status: "joined",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await joinSession("test-session-id", "test-client");

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: "test-client" }),
      });
      expect(result).toEqual(mockSession);
    });

    it("回應不正常時拋出錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(joinSession("test-session-id", "test-client")).rejects.toThrow(
        "Failed to join session, status code: 404"
      );
    });
  });

  describe("輪詢會話", () => {
    it("成功輪詢會話資料", async () => {
      const mockSession = {
        id: "test-session-id",
        host: "test-host",
        client: "test-client",
        status: "signaling",
        createdAt: "2023-01-01T00:00:00.000Z",
        signal: {
          offer: {
            sdp: "test-sdp",
            candidate: ["candidate1", "candidate2"],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSession),
      });

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id");
      expect(result.value).toEqual({ data: mockSession, error: null });
    });

    it("處理 404 狀態並結束輪詢", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "Session has been deleted due to TTL",
      });
      expect(result.done).toBe(false);

      // Generator should be done on next call
      const nextResult = await generator.next();
      expect(nextResult.done).toBe(true);
    });

    it("處理 fetch 錯誤", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "Fetch error: Network error",
      });
    });

    it("處理非正常狀態碼", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "Status code: 500",
      });
    });

    it("處理無效 JSON 回應", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "JSON error: Invalid JSON",
      });
    });

    it("處理無效資料格式", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: "data" }),
      });

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value?.error).toContain("Invalid data:");
      expect(result.value?.data).toBe(null);
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
        type: "invalid",
        sdp: "test-sdp",
      };

      await expect(sendSignal("test-session-id", invalidData)).rejects.toThrow();
    });
  });

  describe("輪詢信號", () => {
    it("成功輪詢 offer 信號", async () => {
      const mockSignalResponse = {
        sdp: "test-offer-sdp",
        candidate: ["candidate1", "candidate2"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSignalResponse),
      });

      const generator = pollingSignal("test-session-id", "offer");
      const result = await generator.next();

      expect(mockFetch).toHaveBeenCalledWith("https://1ureka.vercel.app/api/session/test-session-id/signal?type=offer");
      expect(result.value).toEqual({ data: mockSignalResponse, error: null });
    });

    it("成功輪詢 answer 信號", async () => {
      const mockSignalResponse = {
        sdp: "test-answer-sdp",
        candidate: ["candidate1"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSignalResponse),
      });

      const generator = pollingSignal("test-session-id", "answer");
      const result = await generator.next();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://1ureka.vercel.app/api/session/test-session-id/signal?type=answer"
      );
      expect(result.value).toEqual({ data: mockSignalResponse, error: null });
    });

    it("處理 404 狀態並結束輪詢", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const generator = pollingSignal("test-session-id", "offer");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "Session has been deleted due to TTL",
      });
      expect(result.done).toBe(false);

      // Generator should be done on next call
      const nextResult = await generator.next();
      expect(nextResult.done).toBe(true);
    });

    it("處理無效信號回應格式", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: "signal" }),
      });

      const generator = pollingSignal("test-session-id", "offer");
      const result = await generator.next();

      expect(result.value?.error).toContain("Invalid data:");
      expect(result.value?.data).toBe(null);
    });
  });
});
