import { setState } from "@/transport/store";

/**
 * 創建一個只會有一個 RTCDataChannel，且生命週期與 RTCPeerConnection 綁定的 WebRTC 連線
 * 提供適合 Vanilla ICE 的 API
 */
const createPeerConnection = () => {
  setState({ log: "Creating RTCPeerConnection with Google STUN servers configuration" });
  const localCandidates: string[] = [];
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  });

  peerConnection.onconnectionstatechange = () => {
    const { connectionState } = peerConnection;
    setState({
      log: `RTCPeerConnection state transition detected: ${connectionState}. Monitoring for terminal states.`,
    });
    if (["closed", "disconnected", "failed"].includes(connectionState)) close();
  };

  /**
   * 創建一個只會有一個 RTCDataChannel，且生命週期與 RTCPeerConnection 綁定
   */
  const dataChannelPromise = new Promise<RTCDataChannel>((resolve, reject) => {
    setState({ log: "Initializing RTCDataChannel with negotiated mode and fixed channel ID (0)" });
    // negotiated: true 時，只要 id 相同就能直接建立連線 (對稱寫法)，利用該機制來共用函數
    const dataChannel = peerConnection.createDataChannel("data", { negotiated: true, id: 0, ordered: false });
    dataChannel.onopen = () => resolve(dataChannel);

    dataChannel.onerror = (error) => {
      close();
      reject(error);
    };
    dataChannel.onclose = () => {
      close();
      reject(new Error("DataChannel closed unexpectedly"));
    };
  });

  /**
   * 創建本地 ICE Candidate 收集器
   */
  const candidatePromise = new Promise<string[]>((resolve) => {
    setState({ log: "Setting up local ICE candidate collection handler and starting gathering process" });

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
    setState({
      status: "failed",
      log: "RTCPeerConnection and associated DataChannel have been safely closed and resources released",
    });
  };

  /**
   * 獲取該連線的唯一的 RTCDataChannel，並且可以設定超時時間
   */
  const getDataChannel = (timeout: number) => {
    setState({
      log: `Waiting for DataChannel to open with ${timeout}ms timeout. Establishing peer-to-peer connection...`,
    });
    return Promise.race([
      dataChannelPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DataChannel connection timed out")), timeout)
      ),
    ]);
  };

  /**
   * 獲取本地描述與本地 ICE Candidate，並且可以設定 ICE 收集時間
   */
  const getLocal = async (method: "createOffer" | "createAnswer", timeout: number) => {
    setState({ log: `Generating local SDP ${method === "createOffer" ? "offer" : "answer"} description` });
    const description = await peerConnection[method]();

    setState({ log: `Setting local description and triggering ICE candidate collection with ${timeout}ms timeout` });
    await peerConnection.setLocalDescription(description);

    setState({ log: "Waiting for ICE candidate gathering to complete or timeout" });
    const candidates = await Promise.race([
      candidatePromise,
      new Promise<string[]>((resolve) => setTimeout(() => resolve([...localCandidates]), timeout)),
    ]);

    setState({ log: `Gathered ${candidates.length} ICE candidates` });
    return { description: JSON.stringify(description), candidates };
  };

  /**
   * 設置遠端描述與遠端 ICE Candidate
   */
  const setRemote = async (description: string, candidates: string[]) => {
    setState({ log: "Processing and setting remote SDP description from peer" });
    await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(description)));

    setState({ log: `Adding ${candidates.length} remote ICE candidates to establish connectivity paths` });
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

    if (result.every((r) => r === false)) throw new Error(`failed to add any ICE Candidate`);
  };

  return { getDataChannel, getLocal, setRemote, close };
};

export { createPeerConnection };
