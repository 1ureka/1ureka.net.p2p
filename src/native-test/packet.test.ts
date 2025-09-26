/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */

import { createChunker, createReassembler, PacketEvent } from "../adapter/packet";
import { describe, test, expect } from "vitest";

describe("Packet System Tests", () => {
  describe("Chunker Tests", () => {
    test("小數據 - 小於 MAX_PAYLOAD_SIZE (65525 bytes)", () => {
      const chunker = createChunker(1234);
      const testData = Buffer.from("Hello, World!");

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));

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

    test("中等數據 - 等於 MAX_PAYLOAD_SIZE (65525 bytes)", () => {
      const chunker = createChunker(5678);
      const testData = Buffer.alloc(65525, "A"); // 剛好 MAX_PAYLOAD_SIZE

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));

      // 應該只產生一個 chunk
      expect(chunks).toHaveLength(1);

      const chunk = chunks[0];
      expect(chunk.readUInt16BE(7)).toBe(1); // total_chunks
      expect(chunk.readUInt16BE(9)).toBe(65525); // payload_size
    });

    test("大數據 - 大於 MAX_PAYLOAD_SIZE，需要切片", () => {
      const chunker = createChunker(9999);
      const testData = Buffer.alloc(100000, "B"); // 100KB 數據

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));

      // 應該產生 2 個 chunks (100000 / 65525 = 1.52...)
      expect(chunks).toHaveLength(2);

      // 驗證第一個 chunk
      const firstChunk = chunks[0];
      expect(firstChunk.readUInt16BE(5)).toBe(0); // chunk_index = 0
      expect(firstChunk.readUInt16BE(7)).toBe(2); // total_chunks = 2
      expect(firstChunk.readUInt16BE(9)).toBe(65525); // payload_size = MAX_PAYLOAD_SIZE

      // 驗證第二個 chunk
      const secondChunk = chunks[1];
      expect(secondChunk.readUInt16BE(5)).toBe(1); // chunk_index = 1
      expect(secondChunk.readUInt16BE(7)).toBe(2); // total_chunks = 2
      expect(secondChunk.readUInt16BE(9)).toBe(100000 - 65525); // 剩餘數據大小
    });

    test("chunk_id 循環使用機制 (0-65535)", () => {
      const chunker = createChunker(1111);
      const testData = Buffer.from("test");

      // 生成多個 chunks 來驗證 chunk_id 遞增
      const chunks1 = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));
      const chunks2 = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));
      const chunks3 = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));

      expect(chunks1[0].readUInt16BE(3)).toBe(0); // 第一次使用 chunk_id = 0
      expect(chunks2[0].readUInt16BE(3)).toBe(1); // 第二次使用 chunk_id = 1
      expect(chunks3[0].readUInt16BE(3)).toBe(2); // 第三次使用 chunk_id = 2
    });

    test("邊界條件測試", () => {
      // 測試空數據
      const chunker1 = createChunker(0);
      const emptyData = Buffer.alloc(0);
      const emptyChunks = Array.from(chunker1.generateChunks(PacketEvent.DATA, emptyData));

      expect(emptyChunks).toHaveLength(1);
      expect(emptyChunks[0].readUInt16BE(9)).toBe(0); // payload_size = 0

      // 測試最大 socketId
      const chunker2 = createChunker(65535);
      const maxSocketChunks = Array.from(chunker2.generateChunks(PacketEvent.CONNECT, Buffer.from("test")));
      expect(maxSocketChunks[0].readUInt16BE(1)).toBe(65535);

      // 測試超出範圍的 socketId 應該拋出錯誤
      expect(() => {
        const invalidChunker = createChunker(65536);
        Array.from(invalidChunker.generateChunks(PacketEvent.DATA, Buffer.from("test")));
      }).toThrow("Socket ID 65536 exceeds maximum 65535");
    });

    test("超大數據測試 - 接近理論上限", () => {
      const chunker = createChunker(2222);

      // 測試需要超過 65535 chunks 的數據應該拋出錯誤
      // 65536 * 65525 = 4,294,836,600 bytes (約 4.3GB)
      const maxValidSize = 65535 * 65525; // 最大有效大小

      expect(() => {
        const oversizedData = Buffer.alloc(maxValidSize + 1);
        Array.from(chunker.generateChunks(PacketEvent.DATA, oversizedData));
      }).toThrow("Data too large: requires 65536 chunks, maximum is 65535");
    });

    test("不同事件類型測試", () => {
      const chunker = createChunker(3333);
      const testData = Buffer.from("event test");

      // 測試 CONNECT 事件
      const connectChunks = Array.from(chunker.generateChunks(PacketEvent.CONNECT, testData));
      expect(connectChunks[0].readUInt8(0)).toBe(PacketEvent.CONNECT);

      // 測試 CLOSE 事件
      const closeChunks = Array.from(chunker.generateChunks(PacketEvent.CLOSE, testData));
      expect(closeChunks[0].readUInt8(0)).toBe(PacketEvent.CLOSE);

      // 測試 DATA 事件
      const dataChunks = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));
      expect(dataChunks[0].readUInt8(0)).toBe(PacketEvent.DATA);
    });
  });

  describe("Reassembler Tests", () => {
    test("單一 chunk 重組", () => {
      const chunker = createChunker(4444);
      const reassembler = createReassembler();
      const originalData = Buffer.from("Single chunk test");

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));
      expect(chunks).toHaveLength(1);

      const result = reassembler.processPacket(chunks[0]);

      expect(result).not.toBeNull();
      expect(result!.socketId).toBe(4444);
      expect(result!.event).toBe(PacketEvent.DATA);
      expect(result!.data.equals(originalData)).toBe(true);
    });

    test("多 chunk 順序重組", () => {
      const chunker = createChunker(5555);
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(100000, "C"); // 需要多個 chunks

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(1);

      // 順序處理每個 chunk
      let result = null;
      for (let i = 0; i < chunks.length; i++) {
        result = reassembler.processPacket(chunks[i]);

        if (i < chunks.length - 1) {
          // 未完成的 chunks 應該返回 null
          expect(result).toBeNull();
        }
      }

      // 最後一個 chunk 應該返回完整的重組數據
      expect(result).not.toBeNull();
      expect(result!.socketId).toBe(5555);
      expect(result!.event).toBe(PacketEvent.DATA);
      expect(result!.data.equals(originalData)).toBe(true);
    });

    test("多 chunk 亂序重組", () => {
      const chunker = createChunker(6666);
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(150000, "D"); // 需要多個 chunks

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(2);

      // 亂序處理 chunks (倒序)
      let result = null;
      for (let i = chunks.length - 1; i >= 0; i--) {
        result = reassembler.processPacket(chunks[i]);

        if (i > 0) {
          // 未完成的 chunks 應該返回 null
          expect(result).toBeNull();
        }
      }

      // 最後一個 chunk (實際是第一個) 應該返回完整的重組數據
      expect(result).not.toBeNull();
      expect(result!.data.equals(originalData)).toBe(true);
    });

    test("多 socket 並行重組", () => {
      const chunker1 = createChunker(1001);
      const chunker2 = createChunker(1002);
      const reassembler = createReassembler();

      const data1 = Buffer.alloc(80000, "E");
      const data2 = Buffer.alloc(90000, "F");

      const chunks1 = Array.from(chunker1.generateChunks(PacketEvent.DATA, data1));
      const chunks2 = Array.from(chunker2.generateChunks(PacketEvent.DATA, data2));

      // 交錯處理兩個 socket 的 chunks
      let result1 = null;
      let result2 = null;

      for (let i = 0; i < Math.max(chunks1.length, chunks2.length); i++) {
        if (i < chunks1.length) {
          result1 = reassembler.processPacket(chunks1[i]);
        }
        if (i < chunks2.length) {
          result2 = reassembler.processPacket(chunks2[i]);
        }
      }

      // 兩個 socket 的數據都應該正確重組
      expect(result1).not.toBeNull();
      expect(result1!.socketId).toBe(1001);
      expect(result1!.data.equals(data1)).toBe(true);

      expect(result2).not.toBeNull();
      expect(result2!.socketId).toBe(1002);
      expect(result2!.data.equals(data2)).toBe(true);
    });

    test("不完整訊息處理", () => {
      const chunker = createChunker(7777);
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(100000, "G");

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(1);

      // 只處理部分 chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        const result = reassembler.processPacket(chunks[i]);
        expect(result).toBeNull(); // 不完整應該返回 null
      }

      // 檢查統計資訊
      const stats = reassembler.getStats();
      expect(stats.size).toBe(1); // 應該有一個未完成的項目
      expect(stats.entries[0].receivedChunks).toBe(chunks.length - 1);
      expect(stats.entries[0].totalChunks).toBe(chunks.length);
    });

    test("超時清理機制測試", async () => {
      const chunker = createChunker(8888);
      const reassembler = createReassembler();
      const originalData = Buffer.alloc(100000, "H");

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));

      // 處理一部分 chunks
      reassembler.processPacket(chunks[0]);

      // 檢查有未完成項目
      let stats = reassembler.getStats();
      expect(stats.size).toBe(1);

      // 模擬時間流逝 - 創建新的 reassembler 來測試 prune 邏輯
      // 由於實際的超時是 60 秒，我們通過手動觸發 prune 來測試

      // 等待一小段時間後處理新的封包觸發 prune
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 處理一個新的不相關封包來觸發 prune 檢查
      const newChunker = createChunker(9999);
      const newData = Buffer.from("trigger prune");
      const newChunks = Array.from(newChunker.generateChunks(PacketEvent.DATA, newData));
      reassembler.processPacket(newChunks[0]);

      // 由於時間很短，未完成項目應該還在
      stats = reassembler.getStats();
      expect(stats.size).toBeGreaterThanOrEqual(1);
    });

    test("重組器清理功能", () => {
      const chunker = createChunker(1010);
      const reassembler = createReassembler();
      const testData = Buffer.alloc(100000, "I");

      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, testData));

      // 處理部分 chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        reassembler.processPacket(chunks[i]);
      }

      // 確認有未完成項目
      expect(reassembler.getStats().size).toBe(1);

      // 清理所有項目
      reassembler.close();

      // 確認已清理
      expect(reassembler.getStats().size).toBe(0);
    });

    test("錯誤封包處理", () => {
      const reassembler = createReassembler();

      // 測試太小的封包
      const tooSmallPacket = Buffer.alloc(5);
      expect(() => {
        reassembler.processPacket(tooSmallPacket);
      }).toThrow("Packet too small");

      // 測試錯誤的 payload 大小
      const invalidPacket = Buffer.alloc(20);
      invalidPacket.writeUInt8(PacketEvent.DATA, 0);
      invalidPacket.writeUInt16BE(1000, 1); // socket_id
      invalidPacket.writeUInt16BE(0, 3); // chunk_id
      invalidPacket.writeUInt16BE(0, 5); // chunk_index
      invalidPacket.writeUInt16BE(1, 7); // total_chunks
      invalidPacket.writeUInt16BE(50, 9); // payload_size (但實際只有 9 bytes payload)

      expect(() => {
        reassembler.processPacket(invalidPacket);
      }).toThrow("Packet size mismatch");
    });

    test("不同事件類型重組", () => {
      const chunker = createChunker(2020);
      const reassembler = createReassembler();

      // 測試 CONNECT 事件
      const connectData = Buffer.from("connect payload");
      const connectChunks = Array.from(chunker.generateChunks(PacketEvent.CONNECT, connectData));
      const connectResult = reassembler.processPacket(connectChunks[0]);

      expect(connectResult).not.toBeNull();
      expect(connectResult!.event).toBe(PacketEvent.CONNECT);
      expect(connectResult!.data.equals(connectData)).toBe(true);

      // 測試 CLOSE 事件
      const closeData = Buffer.from("close payload");
      const closeChunks = Array.from(chunker.generateChunks(PacketEvent.CLOSE, closeData));
      const closeResult = reassembler.processPacket(closeChunks[0]);

      expect(closeResult).not.toBeNull();
      expect(closeResult!.event).toBe(PacketEvent.CLOSE);
      expect(closeResult!.data.equals(closeData)).toBe(true);
    });
  });

  describe("Chunker 與 Reassembler 整合測試", () => {
    test("完整循環測試 - 小數據", () => {
      const socketId = 3030;
      const chunker = createChunker(socketId);
      const reassembler = createReassembler();

      const originalData = Buffer.from("Hello, Integration Test!");

      // 切片
      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));

      // 重組
      let finalResult = null;
      for (const chunk of chunks) {
        const result = reassembler.processPacket(chunk);
        if (result) {
          finalResult = result;
        }
      }

      // 驗證結果
      expect(finalResult).not.toBeNull();
      expect(finalResult!.socketId).toBe(socketId);
      expect(finalResult!.event).toBe(PacketEvent.DATA);
      expect(finalResult!.data.equals(originalData)).toBe(true);
    });

    test("完整循環測試 - 大數據", () => {
      const socketId = 4040;
      const chunker = createChunker(socketId);
      const reassembler = createReassembler();

      // 創建 1MB 的測試數據
      const originalData = Buffer.alloc(1024 * 1024);
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = i % 256;
      }

      // 切片
      const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, originalData));
      expect(chunks.length).toBeGreaterThan(10); // 應該需要多個 chunks

      // 重組
      let finalResult = null;
      for (const chunk of chunks) {
        const result = reassembler.processPacket(chunk);
        if (result) {
          finalResult = result;
        }
      }

      // 驗證結果
      expect(finalResult).not.toBeNull();
      expect(finalResult!.socketId).toBe(socketId);
      expect(finalResult!.event).toBe(PacketEvent.DATA);
      expect(finalResult!.data.equals(originalData)).toBe(true);
    });

    test("多訊息並行處理", () => {
      const socketId = 5050;
      const chunker = createChunker(socketId);
      const reassembler = createReassembler();

      // 創建多個不同大小的訊息
      const message1 = Buffer.from("First message");
      const message2 = Buffer.alloc(80000, "X");
      const message3 = Buffer.from("Third message");

      // 分別切片
      const chunks1 = Array.from(chunker.generateChunks(PacketEvent.DATA, message1));
      const chunks2 = Array.from(chunker.generateChunks(PacketEvent.DATA, message2));
      const chunks3 = Array.from(chunker.generateChunks(PacketEvent.CONNECT, message3));

      // 交錯處理所有 chunks
      const allChunks = [...chunks1, ...chunks2, ...chunks3];
      const results: any[] = [];

      for (const chunk of allChunks) {
        const result = reassembler.processPacket(chunk);
        if (result) {
          results.push(result);
        }
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
      const chunker = createChunker(socketId);
      const reassembler = createReassembler();

      const messageCount = 1000;
      const originalMessages: Buffer[] = [];
      const allChunks: Buffer[] = [];

      // 生成大量小訊息
      for (let i = 0; i < messageCount; i++) {
        const message = Buffer.from(`Message ${i}: ${"x".repeat(i % 100)}`);
        originalMessages.push(message);

        const chunks = Array.from(chunker.generateChunks(PacketEvent.DATA, message));
        allChunks.push(...chunks);
      }

      // 處理所有 chunks
      const results: any[] = [];
      for (const chunk of allChunks) {
        const result = reassembler.processPacket(chunk);
        if (result) {
          results.push(result);
        }
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
