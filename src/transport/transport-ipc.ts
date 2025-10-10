import { IPCChannel } from "@/ipc";
import { reportError } from "@/transport-state/report";
import { createDataChannelSender } from "@/transport/transport-sender";

/**
 * 綁定 DataChannel 與 IPC 的雙向資料橋接
 */
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // DataChannel → IPC: 當 DataChannel 收到資料時，轉發到主程序的橋接邏輯
  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      const buffer = event.data;
      if (buffer instanceof ArrayBuffer) {
        window.electron.send(IPCChannel.FromRTC, new Uint8Array(buffer));
      } else if (ArrayBuffer.isView(buffer)) {
        window.electron.send(IPCChannel.FromRTC, buffer);
      } else {
        reportError({ message: "Invalid data type received from DataChannel." });
      }
    } catch (error) {
      reportError({ message: "Cannot process data from DataChannel.", data: error });
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
        reportError({ message: "Invalid data type received from IPC." });
      }
    } catch (error) {
      reportError({ message: "Cannot send data through DataChannel.", data: error });
    }
  };

  window.electron.on(IPCChannel.FromTCP, handleIPCMessage);

  const handleClose = () => {
    dataChannel.removeEventListener("message", handleDataChannelMessage);
    dataChannel.removeEventListener("close", handleClose);
    dataChannel.removeEventListener("error", handleClose);
    window.electron.off(IPCChannel.FromTCP, handleIPCMessage);
    sender.close();
  };

  dataChannel.addEventListener("message", handleDataChannelMessage);
  dataChannel.addEventListener("close", handleClose);
  dataChannel.addEventListener("error", handleClose);
};

export { bindDataChannelIPC };
