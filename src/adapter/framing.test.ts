/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */

import { PacketEvent } from "./packet";
import { createChunker, createReassembler } from "./framing";
import { describe, test, expect } from "vitest";

describe("Packet System Tests", () => {
  describe("Chunker Tests", () => {
    test("小數據 - 小於 MAX_PAYLOAD_SIZE (16384 bytes)", () => {
      const chunker = createChunker();
      const testData = Buffer.from("Hello, World!");

      const chunks = Array.from(chunker.generate(1234, PacketEvent.DATA, testData));

      // 小數據應該只產生一個 chunk
      expect(chunks).toHaveLength(1);

      // 驗證 chunk 結構
      const chunk = chunks[0];
      expect(chunk.length).toBe(11 + testData.length); // header(11) + payload

      // 驗證 header 欄位
      expect(chunk.readUInt8(0)).toBe(PacketEvent.DATA); // event
      expect(chunk.readUInt16BE(1)).toBe(1234); // socket_id
      expect(chunk.readUInt16BE(3)).toBe(0); // chunk_id (第一次使用為 0)
      expect(chunk.readUInt16BE(5)).toBe(0); // chunk_index
      expect(chunk.readUInt16BE(7)).toBe(1); // total_chunks
      expect(chunk.readUInt16BE(9)).toBe(testData.length); // payload_size
    });

    test("中等數據 - 等於 MAX_PAYLOAD_SIZE (16384 bytes)", () => {
      const chunker = createChunker();
      const testData = Buffer.alloc(16384, "A"); // 剛好 MAX_PAYLOAD_SIZE

      const chunks = Array.from(chunker.generate(5678, PacketEvent.DATA, testData));

      // 應該只產生一個 chunk
      expect(chunks).toHaveLength(1);

      const chunk = chunks[0];
      expect(chunk.readUInt16BE(7)).toBe(1); // total_chunks
      expect(chunk.readUInt16BE(9)).toBe(16384); // payload_size
    });

    test("大數據 - 大於 MAX_PAYLOAD_SIZE，需要切片", () => {
      const chunker = createChunker();
      const testData = Buffer.alloc(40000, "B"); // 40KB 數據

      const chunks = Array.from(chunker.generate(9999, PacketEvent.DATA, testData));

      // 應該產生 3 個 chunks (40000 / 16384 = 2.44...)
      expect(chunks).toHaveLength(3);

      // 驗證第一個 chunk
      const firstChunk = chunks[0];
      expect(firstChunk.readUInt16BE(5)).toBe(0); // chunk_index = 0
      expect(firstChunk.readUInt16BE(7)).toBe(3); // total_chunks = 3
      expect(firstChunk.readUInt16BE(9)).toBe(16384); // payload_size = MAX_PAYLOAD_SIZE

      // 驗證第二個 chunk
      const secondChunk = chunks[1];
      expect(secondChunk.readUInt16BE(5)).toBe(1); // chunk_index = 1
      expect(secondChunk.readUInt16BE(7)).toBe(3); // total_chunks = 3
      expect(secondChunk.readUInt16BE(9)).toBe(16384); // payload_size = MAX_PAYLOAD_SIZE

      // 驗證第三個 chunk
      const thirdChunk = chunks[2];
      expect(thirdChunk.readUInt16BE(5)).toBe(2); // chunk_index = 2
      expect(thirdChunk.readUInt16BE(7)).toBe(3); // total_chunks = 3
      expect(thirdChunk.readUInt16BE(9)).toBe(40000 - 16384 * 2); // 剩餘數據大小 = 7232
    });

    test("chunk_id 循環使用機制 (0-65535)", () => {
      const chunker = createChunker();
      const testData = Buffer.from("test");

      // 生成多個 chunks 來驗證 chunk_id 遞增
      const chunks1 = Array.from(chunker.generate(1111, PacketEvent.DATA, testData));
      const chunks2 = Array.from(chunker.generate(1111, PacketEvent.DATA, testData));
      const chunks3 = Array.from(chunker.generate(1111, PacketEvent.DATA, testData));

      expect(chunks1[0].readUInt16BE(3)).toBe(0); // 第一次使用 chunk_id = 0
      expect(chunks2[0].readUInt16BE(3)).toBe(1); // 第二次使用 chunk_id = 1
      expect(chunks3[0].readUInt16BE(3)).toBe(2); // 第三次使用 chunk_id = 2
    });

    test("邊界條件測試", () => {
      // 測試空數據
      const chunker1 = createChunker();
      const emptyData = Buffer.alloc(0);
      const emptyChunks = Array.from(chunker1.generate(0, PacketEvent.DATA, emptyData));

      expect(emptyChunks).toHaveLength(1);
      expect(emptyChunks[0].readUInt16BE(9)).toBe(0); // payload_size = 0

      // 測試最大 socketId
      const chunker2 = createChunker();
      const maxSocketChunks = Array.from(chunker2.generate(65535, PacketEvent.CONNECT, Buffer.from("test")));
      expect(maxSocketChunks[0].readUInt16BE(1)).toBe(65535);

      // 測試超出範圍的 socketId 應該拋出錯誤
      expect(() => {
        const invalidChunker = createChunker();
        Array.from(invalidChunker.generate(65536, PacketEvent.DATA, Buffer.from("test")));
      }).toThrow("Socket ID 65536 exceeds maximum 65535");
    });

    test("超大數據測試 - 接近理論上限", () => {
      const chunker = createChunker();

      // 測試需要超過 65535 chunks 的數據應該拋出錯誤
      // 65536 * 16384 = 1,073,741,824 bytes (1GB)
      const maxValidSize = 65535 * 16384; // 最大有效大小

      expect(() => {
        const oversizedData = Buffer.alloc(maxValidSize + 1);
        Array.from(chunker.generate(2222, PacketEvent.DATA, oversizedData));
      }).toThrow("Data too large: requires 65536 chunks, maximum is 65535");
    });

    test("不同事件類型測試", () => {
      const chunker = createChunker();
      const testData = Buffer.from("event test");

      // 測試 CONNECT 事件
      const connectChunks = Array.from(chunker.generate(3333, PacketEvent.CONNECT, testData));
      expect(connectChunks[0].readUInt8(0)).toBe(PacketEvent.CONNECT);

      // 測試 CLOSE 事件
      const closeChunks = Array.from(chunker.generate(3333, PacketEvent.CLOSE, testData));
      expect(closeChunks[0].readUInt8(0)).toBe(PacketEvent.CLOSE);

      // 測試 DATA 事件
      const dataChunks = Array.from(chunker.generate(3333, PacketEvent.DATA, testData));
      expect(dataChunks[0].readUInt8(0)).toBe(PacketEvent.DATA);
    });
  });

  describe("Reassembler Tests", () => {
    test("單一 chunk 重組", () => {
      const chunker = createChunker();
      const reassembler = createReassembler();
      const originalData = Buffer.from("Single chunk test");

      const chunks = Array.from(chunker.generate(4444, PacketEvent.DATA, originalData));
      expect(chunks).toHaveLength(1);

      const results = Array.from(reassembler.processPacket(chunks[0]));

      expect(results).toHaveLength(1);
      expect(results[0].socketId).toBe(4444);
      expect(results[0].event).toBe(PacketEvent.DATA);
      expect(results[0].data.equals(originalData)).toBe(true);
    });

    test("多 chunk 順序重組", () => {
      const chunker = createChunker();
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(50000, "C"); // 需要多個 chunks (約 4 個 chunks)

      const chunks = Array.from(chunker.generate(5555, PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(1);

      // 順序處理每個 chunk
      const allResults: any[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const results = Array.from(reassembler.processPacket(chunks[i]));
        allResults.push(...results);
      }

      // 最後一個 chunk 應該返回完整的重組數據
      expect(allResults).toHaveLength(1);
      expect(allResults[0].socketId).toBe(5555);
      expect(allResults[0].event).toBe(PacketEvent.DATA);
      expect(allResults[0].data.equals(originalData)).toBe(true);
    });

    test("多 chunk 亂序重組", () => {
      const chunker = createChunker();
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(60000, "D"); // 需要多個 chunks (約 4 個 chunks)

      const chunks = Array.from(chunker.generate(6666, PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(2);

      // 亂序處理 chunks (倒序)
      const allResults: any[] = [];
      for (let i = chunks.length - 1; i >= 0; i--) {
        const results = Array.from(reassembler.processPacket(chunks[i]));
        allResults.push(...results);
      }

      // 最後一個 chunk (實際是第一個) 應該返回完整的重組數據
      expect(allResults).toHaveLength(1);
      expect(allResults[0].data.equals(originalData)).toBe(true);
    });

    test("多 socket 並行重組", () => {
      const chunker1 = createChunker();
      const chunker2 = createChunker();
      const reassembler = createReassembler();

      const data1 = Buffer.alloc(35000, "E");
      const data2 = Buffer.alloc(45000, "F");

      const chunks1 = Array.from(chunker1.generate(1001, PacketEvent.DATA, data1));
      const chunks2 = Array.from(chunker2.generate(1002, PacketEvent.DATA, data2));

      // 交錯處理兩個 socket 的 chunks
      const allResults: any[] = [];

      for (let i = 0; i < Math.max(chunks1.length, chunks2.length); i++) {
        if (i < chunks1.length) {
          const results = Array.from(reassembler.processPacket(chunks1[i]));
          allResults.push(...results);
        }
        if (i < chunks2.length) {
          const results = Array.from(reassembler.processPacket(chunks2[i]));
          allResults.push(...results);
        }
      }

      // 兩個 socket 的數據都應該正確重組
      expect(allResults).toHaveLength(2);

      const result1 = allResults.find((r) => r.socketId === 1001);
      const result2 = allResults.find((r) => r.socketId === 1002);

      expect(result1).toBeDefined();
      expect(result1.data.equals(data1)).toBe(true);

      expect(result2).toBeDefined();
      expect(result2.data.equals(data2)).toBe(true);
    });

    test("不完整訊息處理", () => {
      const chunker = createChunker();
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(50000, "G");

      const chunks = Array.from(chunker.generate(7777, PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(1);

      // 只處理部分 chunks
      const allResults: any[] = [];
      for (let i = 0; i < chunks.length - 1; i++) {
        const results = Array.from(reassembler.processPacket(chunks[i]));
        allResults.push(...results);
      }

      // 不完整應該沒有返回結果
      expect(allResults).toHaveLength(0);
    });

    test("錯誤封包處理", () => {
      const reassembler = createReassembler();

      // 測試太小的封包
      const tooSmallPacket = Buffer.alloc(5);
      expect(() => {
        Array.from(reassembler.processPacket(tooSmallPacket));
      }).toThrow("Packet too small: expected at least 11 bytes, got 5");

      // 測試錯誤的 payload 大小
      const invalidPacket = Buffer.alloc(20);
      invalidPacket.writeUInt8(PacketEvent.DATA, 0);
      invalidPacket.writeUInt16BE(1000, 1); // socket_id
      invalidPacket.writeUInt16BE(0, 3); // chunk_id
      invalidPacket.writeUInt16BE(0, 5); // chunk_index
      invalidPacket.writeUInt16BE(1, 7); // total_chunks
      invalidPacket.writeUInt16BE(50, 9); // payload_size (但實際只有 9 bytes payload)

      expect(() => {
        Array.from(reassembler.processPacket(invalidPacket));
      }).toThrow("Packet size mismatch: expected 61, got 20");
    });

    test("不同事件類型重組", () => {
      const chunker = createChunker();
      const reassembler = createReassembler();

      // 測試 CONNECT 事件 - 使用較大數據測試多 chunk
      const connectData = Buffer.alloc(25000, "K");
      const connectChunks = Array.from(chunker.generate(2020, PacketEvent.CONNECT, connectData));

      const allResults: any[] = [];
      for (const chunk of connectChunks) {
        const results = Array.from(reassembler.processPacket(chunk));
        allResults.push(...results);
      }

      expect(allResults).toHaveLength(1);
      expect(allResults[0].event).toBe(PacketEvent.CONNECT);
      expect(allResults[0].data.equals(connectData)).toBe(true);

      // 測試 CLOSE 事件
      const closeData = Buffer.from("close payload");
      const closeChunks = Array.from(chunker.generate(2020, PacketEvent.CLOSE, closeData));
      const closeResults = Array.from(reassembler.processPacket(closeChunks[0]));

      expect(closeResults).toHaveLength(1);
      expect(closeResults[0].event).toBe(PacketEvent.CLOSE);
      expect(closeResults[0].data.equals(closeData)).toBe(true);
    });
  });

  describe("Chunker 與 Reassembler 整合測試", () => {
    test("完整循環測試 - 小數據", () => {
      const socketId = 3030;
      const chunker = createChunker();
      const reassembler = createReassembler();

      const originalData = Buffer.from("Hello, Integration Test!");

      // 切片
      const chunks = Array.from(chunker.generate(socketId, PacketEvent.DATA, originalData));

      // 重組
      const allResults: any[] = [];
      for (const chunk of chunks) {
        const results = Array.from(reassembler.processPacket(chunk));
        allResults.push(...results);
      }

      // 驗證結果
      expect(allResults).toHaveLength(1);
      expect(allResults[0].socketId).toBe(socketId);
      expect(allResults[0].event).toBe(PacketEvent.DATA);
      expect(allResults[0].data.equals(originalData)).toBe(true);
    });

    test("完整循環測試 - 大數據", () => {
      const socketId = 4040;
      const chunker = createChunker();
      const reassembler = createReassembler();

      // 創建 256KB 的測試數據
      const originalData = Buffer.alloc(256 * 1024);
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = i % 256;
      }

      // 切片
      const chunks = Array.from(chunker.generate(socketId, PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(10); // 應該需要多個 chunks

      // 重組
      const allResults: any[] = [];
      for (const chunk of chunks) {
        const results = Array.from(reassembler.processPacket(chunk));
        allResults.push(...results);
      }

      // 驗證結果
      expect(allResults).toHaveLength(1);
      expect(allResults[0].socketId).toBe(socketId);
      expect(allResults[0].event).toBe(PacketEvent.DATA);
      expect(allResults[0].data.equals(originalData)).toBe(true);
    });

    test("多訊息並行處理", () => {
      const socketId = 5050;
      const chunker = createChunker();
      const reassembler = createReassembler();

      // 創建多個不同大小的訊息
      const message1 = Buffer.from("First message");
      const message2 = Buffer.alloc(40000, "X");
      const message3 = Buffer.from("Third message");

      // 分別切片
      const chunks1 = Array.from(chunker.generate(socketId, PacketEvent.DATA, message1));
      const chunks2 = Array.from(chunker.generate(socketId, PacketEvent.DATA, message2));
      const chunks3 = Array.from(chunker.generate(socketId, PacketEvent.CONNECT, message3));

      // 交錯處理所有 chunks
      const allChunks = [...chunks1, ...chunks2, ...chunks3];
      const results: any[] = [];

      for (const chunk of allChunks) {
        const chunkResults = Array.from(reassembler.processPacket(chunk));
        results.push(...chunkResults);
      }

      // 應該收到 3 個完整訊息
      expect(results).toHaveLength(3);

      // 驗證每個訊息 (按 chunk_id 順序)
      const sortedResults = results.sort((a, b) => {
        // 根據重組順序，第一個完成的應該是最小的訊息
        return a.data.length - b.data.length;
      });

      expect(sortedResults[0].data.equals(message1)).toBe(true);
      expect(sortedResults[0].event).toBe(PacketEvent.DATA);

      expect(sortedResults[1].data.equals(message3)).toBe(true);
      expect(sortedResults[1].event).toBe(PacketEvent.CONNECT);

      expect(sortedResults[2].data.equals(message2)).toBe(true);
      expect(sortedResults[2].event).toBe(PacketEvent.DATA);
    });

    test("壓力測試 - 大量小訊息", () => {
      const socketId = 6060;
      const chunker = createChunker();
      const reassembler = createReassembler();

      const messageCount = 1000;
      const originalMessages: Buffer[] = [];
      const allChunks: Buffer[] = [];

      // 生成大量小訊息
      for (let i = 0; i < messageCount; i++) {
        const message = Buffer.from(`Message ${i}: ${"x".repeat(i % 100)}`);
        originalMessages.push(message);

        const chunks = Array.from(chunker.generate(socketId, PacketEvent.DATA, message));
        allChunks.push(...chunks);
      }

      // 處理所有 chunks
      const results: any[] = [];
      for (const chunk of allChunks) {
        const chunkResults = Array.from(reassembler.processPacket(chunk));
        results.push(...chunkResults);
      }

      // 應該收到所有訊息
      expect(results).toHaveLength(messageCount);

      // 驗證每個訊息都正確重組 (無需驗證順序，因為 chunk_id 會循環)
      for (const result of results) {
        expect(result.socketId).toBe(socketId);
        expect(result.event).toBe(PacketEvent.DATA);

        // 檢查是否為原始訊息之一
        const isValidMessage = originalMessages.some((original) => original.equals(result.data));
        expect(isValidMessage).toBe(true);
      }
    });
  });
});
