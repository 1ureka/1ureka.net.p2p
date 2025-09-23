import { setState } from "@/store/webrtc";

/**
 * 為 RTCDataChannel 創建一個發送器，確保在緩衝區滿時不會丟失資料。
 * 當緩衝區超過指定閾值時，會暫停發送，直到緩衝區降到閾值以下。
 */
function createDataChannelSender(dataChannel: RTCDataChannel, threshold = 64 * 1024) {
  const queue: (ArrayBuffer | ArrayBufferView<ArrayBuffer>)[] = [];
  let draining = false;

  dataChannel.bufferedAmountLowThreshold = threshold;

  function drainQueue() {
    if (draining) return;
    draining = true;

    if (dataChannel.readyState !== "open") {
      setState({ error: "Received data when DataChannel is not open" });
      return;
    }

    while (queue.length > 0) {
      const chunk = queue.shift()!;

      if (chunk instanceof ArrayBuffer) {
        dataChannel.send(chunk);
      } else if (ArrayBuffer.isView(chunk)) {
        dataChannel.send(chunk);
      }

      if (dataChannel.bufferedAmount > threshold) {
        setState({ log: "DataChannel buffer full, pausing send..." });
        return; // 等待 'bufferedamountlow' 事件
      }
    }

    draining = false;
  }

  dataChannel.addEventListener("bufferedamountlow", () => {
    draining = false;
    drainQueue();
  });

  return {
    push(chunk: ArrayBuffer | ArrayBufferView<ArrayBuffer>) {
      queue.push(chunk);
      drainQueue();
    },
  };
}

export { createDataChannelSender };
