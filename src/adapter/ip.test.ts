import { describe, it, expect } from "vitest";
import { classifyAddress } from "./ip";

describe("classifyAddress", () => {
  describe("IPv4 Local (127.0.0.0/8)", () => {
    it("應該識別 127.0.0.1 為 ipv4local", () => {
      expect(classifyAddress("127.0.0.1")).toBe("ipv4local");
    });

    it("應該識別 127.0.0.0 為 ipv4local", () => {
      expect(classifyAddress("127.0.0.0")).toBe("ipv4local");
    });

    it("應該識別 127.255.255.255 為 ipv4local", () => {
      expect(classifyAddress("127.255.255.255")).toBe("ipv4local");
    });

    it("應該識別 127.100.50.25 為 ipv4local", () => {
      expect(classifyAddress("127.100.50.25")).toBe("ipv4local");
    });
  });

  describe("IPv6 Local (loopback)", () => {
    it("應該識別 ::1 為 ipv6local", () => {
      expect(classifyAddress("::1")).toBe("ipv6local");
    });

    it("應該識別 0:0:0:0:0:0:0:1 為 ipv6local", () => {
      expect(classifyAddress("0:0:0:0:0:0:0:1")).toBe("ipv6local");
    });
  });

  describe("LAN (Private Network)", () => {
    it("應該識別 10.0.0.0/8 範圍內的 IP 為 lan", () => {
      expect(classifyAddress("10.0.0.0")).toBe("lan");
      expect(classifyAddress("10.0.0.1")).toBe("lan");
      expect(classifyAddress("10.255.255.255")).toBe("lan");
      expect(classifyAddress("10.123.45.67")).toBe("lan");
    });

    it("應該識別 172.16.0.0/12 範圍內的 IP 為 lan", () => {
      expect(classifyAddress("172.16.0.0")).toBe("lan");
      expect(classifyAddress("172.16.0.1")).toBe("lan");
      expect(classifyAddress("172.31.255.255")).toBe("lan");
      expect(classifyAddress("172.20.10.5")).toBe("lan");
    });

    it("應該識別 192.168.0.0/16 範圍內的 IP 為 lan", () => {
      expect(classifyAddress("192.168.0.0")).toBe("lan");
      expect(classifyAddress("192.168.0.1")).toBe("lan");
      expect(classifyAddress("192.168.255.255")).toBe("lan");
      expect(classifyAddress("192.168.1.100")).toBe("lan");
    });

    it("應該排除 172.15.x.x（不在 172.16.0.0/12 範圍內）", () => {
      expect(classifyAddress("172.15.255.255")).not.toBe("lan");
    });

    it("應該排除 172.32.x.x（不在 172.16.0.0/12 範圍內）", () => {
      expect(classifyAddress("172.32.0.0")).not.toBe("lan");
    });
  });

  describe("External (Public IP)", () => {
    it("應該識別 8.8.8.8 為 external", () => {
      expect(classifyAddress("8.8.8.8")).toBe("external");
    });

    it("應該識別 1.1.1.1 為 external", () => {
      expect(classifyAddress("1.1.1.1")).toBe("external");
    });

    it("應該識別 123.45.67.89 為 external", () => {
      expect(classifyAddress("123.45.67.89")).toBe("external");
    });

    it("應該識別公開的 IPv6 位址為 external", () => {
      expect(classifyAddress("2001:4860:4860::8888")).toBe("external");
      expect(classifyAddress("2606:4700:4700::1111")).toBe("external");
    });
  });

  describe("Invalid IP", () => {
    it("應該識別無效的 IP 字串為 invalid", () => {
      expect(classifyAddress("invalid")).toBe("invalid");
      expect(classifyAddress("999.999.999.999")).toBe("invalid");
      expect(classifyAddress("")).toBe("invalid");
      expect(classifyAddress("abc.def.ghi.jkl")).toBe("invalid");
    });

    it("應該識別格式錯誤的 IPv6 為 invalid", () => {
      expect(classifyAddress("gggg::1")).toBe("invalid");
      expect(classifyAddress("::::::")).toBe("invalid");
    });
  });

  describe("Edge Cases", () => {
    it("應該正確處理 0.0.0.0", () => {
      // 0.0.0.0 不在任何私有或本地範圍內，應該是 external 或根據實際實作
      const result = classifyAddress("0.0.0.0");
      expect(["external", "invalid"]).toContain(result);
    });

    it("應該正確處理 255.255.255.255", () => {
      // 廣播位址，應該是 external
      expect(classifyAddress("255.255.255.255")).toBe("external");
    });

    it("應該正確處理 IPv4-mapped IPv6 位址", () => {
      // ::ffff:127.0.0.1 是 IPv4-mapped IPv6，應該被識別為 ipv4local
      expect(classifyAddress("::ffff:127.0.0.1")).toBe("ipv4local");
    });

    it("應該正確處理 IPv4-mapped IPv6 LAN 位址", () => {
      // ::ffff:192.168.1.1 應該被識別為 lan
      expect(classifyAddress("::ffff:192.168.1.1")).toBe("lan");
    });
  });
});
