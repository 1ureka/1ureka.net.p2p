/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSession, joinSession, pollingSession, sendSignal, pollingSignal } from "./session-utils";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Session Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createSession", () => {
    it("should create a session successfully", async () => {
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

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(createSession("test-host")).rejects.toThrow("Failed to create session, status code: 400");
    });

    it("should throw error when response data is invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: "data" }),
      });

      await expect(createSession("test-host")).rejects.toThrow();
    });
  });

  describe("joinSession", () => {
    it("should join a session successfully", async () => {
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

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(joinSession("test-session-id", "test-client")).rejects.toThrow(
        "Failed to join session, status code: 404"
      );
    });
  });

  describe("pollingSession", () => {
    it("should poll session data successfully", async () => {
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

    it("should handle 404 status and end polling", async () => {
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

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const generator = pollingSession("test-session-id");
      const result = await generator.next();

      expect(result.value).toEqual({
        data: null,
        error: "Fetch error: Network error",
      });
    });

    it("should handle non-ok status codes", async () => {
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

    it("should handle invalid JSON response", async () => {
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

    it("should handle invalid data format", async () => {
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

  describe("sendSignal", () => {
    it("should send offer signal successfully", async () => {
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

    it("should send answer signal successfully", async () => {
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

    it("should throw error when response is not ok", async () => {
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

    it("should throw error for invalid signal data", async () => {
      const invalidData = {
        type: "invalid",
        sdp: "test-sdp",
      };

      await expect(sendSignal("test-session-id", invalidData)).rejects.toThrow();
    });
  });

  describe("pollingSignal", () => {
    it("should poll offer signal successfully", async () => {
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

    it("should poll answer signal successfully", async () => {
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

    it("should handle 404 status and end polling", async () => {
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

    it("should handle invalid signal response format", async () => {
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
