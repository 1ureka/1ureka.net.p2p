import { IPCChannel } from "@/ipc";
import { reportError } from "@/transport/store";
import { createDataChannelSender } from "@/transport/transport-sender";

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
        window.electron.send(IPCChannel.FromRTC, new Uint8Array(buffer));
      } else if (ArrayBuffer.isView(buffer)) {
        window.electron.send(IPCChannel.FromRTC, buffer);
      } else {
        reportError({ message: "Received invalid data type from DataChannel" });
      }
    } catch (error) {
      reportError({ message: "Failed to process data received from DataChannel", data: error });
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
        reportError({ message: "Received invalid data type from IPC" });
      }
    } catch (error) {
      reportError({ message: "Failed to send data through DataChannel", data: error });
    }
  };

  // 註冊 IPC 監聽器
  window.electron.on(IPCChannel.FromTCP, handleIPCMessage);

  const cleanup = () => {
    window.electron.off(IPCChannel.FromTCP, handleIPCMessage);
    sender.close();
  };

  dataChannel.onclose = () => cleanup();
  dataChannel.onerror = () => cleanup();
};

export { bindDataChannelIPC };
