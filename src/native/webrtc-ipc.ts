import { setState } from "@/store/webrtc";
import { createDataChannelSender } from "@/native/webrtc-sender";

/**
 * 綁定 DataChannel 與 IPC 的雙向資料橋接
 */
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // DataChannel → IPC: 當 DataChannel 收到資料時，轉發到主程序的橋接邏輯
  dataChannel.onmessage = (event) => {
    try {
      const buffer = event.data;
      if (buffer instanceof ArrayBuffer) {
        window.electron.send("bridge.data.rtc", new Uint8Array(buffer));
      } else if (ArrayBuffer.isView(buffer)) {
        window.electron.send("bridge.data.rtc", buffer);
      } else {
        setState({ error: "Received invalid data type from DataChannel" });
      }
    } catch (error) {
      setState({ error: "Failed to process data received from DataChannel" });
    }
  };

  // IPC → DataChannel: 監聽來自主程序的資料並透過 DataChannel 發送
  const handleIPCMessage = (buffer: unknown) => {
    try {
      if (buffer instanceof ArrayBuffer) {
        sender.push(buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        sender.push(buffer as ArrayBufferView<ArrayBuffer>);
      } else {
        setState({ error: "Received invalid data type from IPC" });
      }
    } catch (error) {
      setState({ error: "Failed to send data through DataChannel" });
    }
  };

  // 註冊 IPC 監聽器
  window.electron.on("bridge.data.tcp", handleIPCMessage);

  // 設置清理函數，當 DataChannel 關閉時移除監聽器與關閉 sender
  dataChannel.onclose = () => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };

  dataChannel.onerror = (error) => {
    window.electron.off("bridge.data.tcp", handleIPCMessage);
    sender.close();
  };
};

export { bindDataChannelIPC };
