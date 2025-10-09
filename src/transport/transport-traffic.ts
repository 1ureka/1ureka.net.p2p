import { reportEgress, reportIngress, startTrafficMonitoring, stopTrafficMonitoring } from "@/transport-state/report";

/**
 * 綁定 DataChannel 流量監控
 * 監控傳入與傳出的資料量，並回報給流量監控系統
 */
const bindDataChannelTraffic = (dataChannel: RTCDataChannel) => {
  // 啟動流量監控系統
  startTrafficMonitoring();

  // 監控傳入流量 (Ingress)
  const handleIngress = (event: MessageEvent) => {
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

      if (bytes > 0) reportIngress(bytes);
    } catch {
      // 忽略統計錯誤，畢竟報告也無意義
    }
  };

  // 監控傳出流量 (Egress)（透過 monkey patch send 方法）
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
        reportEgress(bytes);
      }
    } catch {
      // 忽略統計錯誤，繼續發送
    }

    return originalSend(data);
  };

  const handleClose = () => {
    dataChannel.removeEventListener("message", handleIngress);
    dataChannel.removeEventListener("close", handleClose);
    dataChannel.removeEventListener("error", handleClose);
    dataChannel.send = originalSend;
    stopTrafficMonitoring();
  };

  dataChannel.addEventListener("message", handleIngress);
  dataChannel.addEventListener("close", handleClose);
  dataChannel.addEventListener("error", handleClose);
};

export { bindDataChannelTraffic };
