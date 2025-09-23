import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReporter, getLock } from "../native/bridge-report";

// 建立假的 BrowserWindow
const mockWin = {
  webContents: {
    send: vi.fn(),
  },
} as any; // 簡單 mock，避免引入 electron

describe("createReporter 模組", () => {
  let reporter: ReturnType<typeof createReporter>;

  beforeEach(() => {
    // 每次測試前重置
    vi.clearAllMocks();
    reporter = createReporter("測試模組", mockWin);
  });

  it("應該能回報狀態並更新 store", () => {
    reporter.reportStatus("connected");

    expect(mockWin.webContents.send).toHaveBeenCalledWith("bridge.status", "connected");
    expect(getLock()).toBe(true); // status 為 connected 時 lock = true
  });

  it("應該能新增 log 到歷史紀錄並呼叫 console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    reporter.reportLog({ message: "哈囉", data: { foo: 1 } });

    expect(mockWin.webContents.send).toHaveBeenCalledWith("bridge.history", expect.any(Array));
    expect(spy).toHaveBeenCalledWith("測試模組", "INFO", "哈囉", { foo: 1 });
    spy.mockRestore();
  });

  it("應該能清空歷史紀錄", () => {
    reporter.reportLog({ message: "訊息" });
    reporter.clearHistory();

    expect(mockWin.webContents.send).toHaveBeenCalledWith("bridge.history", []);
  });

  it("應該能回報錯誤並呼叫 console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reporter.reportError({ message: "出錯了" });

    expect(spy).toHaveBeenCalledWith("測試模組", "ERROR", "出錯了", "");
    spy.mockRestore();
  });

  it("應該能回報警告並呼叫 console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    reporter.reportWarn({ message: "小心點" });

    expect(spy).toHaveBeenCalledWith("測試模組", "WARN", "小心點", "");
    spy.mockRestore();
  });
});
