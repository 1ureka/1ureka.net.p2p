import { reportLog, reportStatus } from "@/transport-state/report";

/**
 * 創建一個只會有一個 RTCDataChannel，且生命週期與 RTCPeerConnection 綁定的 WebRTC 連線
 * 提供適合 Vanilla ICE 的 API
 */
const createPeerConnection = () => {
  reportLog({ message: "Creating RTCPeerConnection with STUN server configuration." });
  const localCandidates: string[] = [];
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  });

  peerConnection.onconnectionstatechange = () => {
    const { connectionState } = peerConnection;
    reportLog({ message: `RTCPeerConnection state changed to ${connectionState}.` });
    if (["closed", "disconnected", "failed"].includes(connectionState)) close();
  };

  /**
   * 創建一個只會有一個 RTCDataChannel，且生命週期與 RTCPeerConnection 綁定
   */
  const dataChannelPromise = new Promise<RTCDataChannel>((resolve, reject) => {
    reportLog({ message: "Initializing RTCDataChannel with negotiated mode (channel ID: 0)." });
    // negotiated: true 時，只要 id 相同就能直接建立連線 (對稱寫法)，利用該機制來共用函數
    const dataChannel = peerConnection.createDataChannel("data", { negotiated: true, id: 0, ordered: false });
    dataChannel.onopen = () => resolve(dataChannel);

    dataChannel.onerror = (error) => {
      close();
      reject(error);
    };
    dataChannel.onclose = () => {
      close();
      reject(new Error("DataChannel closed unexpectedly."));
    };
  });

  /**
   * 因為 getDataChannel 通常會在未來某個時間點才會被呼叫，所以這邊先捕捉錯誤，只是為了避免無意義的 console.error
   * 由於 dataChannelPromise 本身仍是同個 Promise，因此 getDataChannel 仍然可以捕捉到同樣的錯誤
   */
  dataChannelPromise.catch(() => {}); /* eslint-disable-line @typescript-eslint/no-empty-function */

  /**
   * 創建本地 ICE Candidate 收集器
   */
  const candidatePromise = new Promise<string[]>((resolve) => {
    reportLog({ message: "Starting ICE candidate gathering." });

    peerConnection.onicecandidate = (event) => {
      const candidate = event.candidate;
      if (candidate) localCandidates.push(JSON.stringify(candidate.toJSON()));
      else resolve([...localCandidates]); // 當 candidate 為 null 時，表示 ICE 收集完成
    };
  });

  /**
   * 該連線的唯一的關閉連線函數
   */
  const close = () => {
    peerConnection.close(); // 根據 w3c ED，其是冪等，因此不需擔心重複呼叫
    reportStatus("failed");
    reportLog({ message: "RTCPeerConnection and DataChannel closed successfully." });
  };

  /**
   * 獲取該連線的唯一的 RTCDataChannel，並且可以設定超時時間
   */
  const getDataChannel = (timeout: number) => {
    reportLog({ message: `Waiting for DataChannel to open (timeout: ${timeout}ms)...` });
    return Promise.race([
      dataChannelPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DataChannel connection timed out.")), timeout)
      ),
    ]);
  };

  /**
   * 獲取本地描述與本地 ICE Candidate，並且可以設定 ICE 收集時間
   */
  const getLocal = async (method: "createOffer" | "createAnswer", timeout: number) => {
    reportLog({ message: `Generating local SDP ${method === "createOffer" ? "offer" : "answer"}.` });
    const description = await peerConnection[method]();

    reportLog({ message: `Setting local description. ICE gathering timeout: ${timeout}ms.` });
    await peerConnection.setLocalDescription(description);

    reportLog({ message: "Waiting for ICE candidate gathering to complete..." });
    const candidates = await Promise.race([
      candidatePromise,
      new Promise<string[]>((resolve) => setTimeout(() => resolve([...localCandidates]), timeout)),
    ]);

    reportLog({ message: `Gathered ${candidates.length} ICE candidate(s).` });
    return { description: JSON.stringify(description), candidates };
  };

  /**
   * 設置遠端描述與遠端 ICE Candidate
   */
  const setRemote = async (description: string, candidates: string[]) => {
    reportLog({ message: "Setting remote SDP description." });
    await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(description)));

    reportLog({ message: `Adding ${candidates.length} remote ICE candidate(s).` });
    const result = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
          return true;
        } catch {
          return false;
        }
      })
    );

    if (result.every((r) => r === false)) throw new Error("Failed to add any ICE candidate.");
  };

  return { getDataChannel, getLocal, setRemote, close };
};

export { createPeerConnection };
