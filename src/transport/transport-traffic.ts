import { reportTraffic, startTrafficMonitoring, stopTrafficMonitoring } from "@/transport-state/report";

/**
 * 綁定 DataChannel 流量監控
 * 監控傳入與傳出的資料量，並回報給流量監控系統
 */
const bindDataChannelTraffic = (dataChannel: RTCDataChannel) => {
  // 啟動流量監控系統
  startTrafficMonitoring();

  // 監控傳入流量
  const originalOnMessage = dataChannel.onmessage;
  dataChannel.onmessage = (event) => {
    try {
      const data = event.data;
      let bytes = 0;

      if (data instanceof ArrayBuffer) {
        bytes = data.byteLength;
      } else if (ArrayBuffer.isView(data)) {
        bytes = data.byteLength;
      } else if (typeof data === "string") {
        bytes = new Blob([data]).size;
      }

      if (bytes > 0) {
        reportTraffic(bytes);
      }

      // 呼叫原始的 onmessage handler
      if (originalOnMessage) {
        originalOnMessage.call(dataChannel, event);
      }
    } catch (error) {
      // 即使發生錯誤也繼續呼叫原始 handler
      if (originalOnMessage) {
        originalOnMessage.call(dataChannel, event);
      }
    }
  };

  // 監控傳出流量（透過 monkey patch send 方法）
  const originalSend = dataChannel.send.bind(dataChannel);
  dataChannel.send = (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
    try {
      let bytes = 0;

      if (data instanceof ArrayBuffer) {
        bytes = data.byteLength;
      } else if (ArrayBuffer.isView(data)) {
        bytes = data.byteLength;
      } else if (data instanceof Blob) {
        bytes = data.size;
      } else if (typeof data === "string") {
        bytes = new Blob([data]).size;
      }

      if (bytes > 0) {
        reportTraffic(bytes);
      }
    } catch {
      // 忽略統計錯誤，繼續發送
    }

    // 呼叫原始的 send 方法
    return originalSend(data);
  };

  // 清理函數
  const cleanup = () => {
    dataChannel.removeEventListener("close", cleanup);
    dataChannel.removeEventListener("error", cleanup);
    dataChannel.send = originalSend;
    dataChannel.onmessage = originalOnMessage;
    stopTrafficMonitoring();
  };

  dataChannel.addEventListener("close", cleanup);
  dataChannel.addEventListener("error", cleanup);
};

export { bindDataChannelTraffic };
