import { create } from "zustand";
import { tryCatch } from "src/utils";

// 採用 Vanilla ICE

type WebRTCStore = {
  role: "host" | "client";
  setRole: (role: "host" | "client") => void; // 每次呼叫時，重新創建 RTCPeerConnection 與清空 state

  localDescription: string;
  localICECandidates: string[];
  getLocal: () => Promise<void>;

  remoteDescription: string;
  remoteICECandidates: string[];
  setRemote: (sdp: string, candidates: string[]) => Promise<void>;

  status: "等待參數" | "等待連線" | "連線中" | "已連線"; // 等待連線是參數完整但還沒按下 connect 按鈕
  connect: () => Promise<null | string>;
};

const useWebRTC = create<WebRTCStore>((set, get) => {
  let peerConnection: RTCPeerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  });

  const reset = () => {
    peerConnection.close();
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    });

    set({
      localDescription: "",
      remoteDescription: "",
      localICECandidates: [],
      remoteICECandidates: [],
      status: "等待參數",
    });
  };

  const setRole = (role: "host" | "client") => {
    reset();
    set({ role });
  };

  const getLocal = async () => {
    const { role, remoteDescription, remoteICECandidates } = get();

    if (role === "client" && !remoteDescription && !remoteICECandidates)
      return console.error("加入方需要先設置遠端資訊");

    const candidatesPromise = new Promise<string[]>((resolve) => {
      const candidates: string[] = [];

      peerConnection.onicecandidate = (event) => {
        const candidate = event.candidate?.candidate;
        if (candidate) candidates.push(candidate);
        else resolve(candidates); // 當 candidate 為 null 時，表示 ICE 收集完成
      };
    });

    if (role === "host") {
      const { data: offer, error } = await tryCatch(peerConnection.createOffer());
      if (error) return console.error("創建 offer 失敗:", error);

      const { error: sdpError } = await tryCatch(peerConnection.setLocalDescription(offer));
      if (sdpError) return console.error("設置本地描述失敗:", sdpError);

      set({ localDescription: offer.sdp || "", localICECandidates: await candidatesPromise });
    }

    if (role === "client") {
      const { data: answer, error } = await tryCatch(peerConnection.createAnswer());
      if (error) return console.error("創建 answer 失敗:", error);

      const { error: sdpError } = await tryCatch(peerConnection.setLocalDescription(answer));
      if (sdpError) return console.error("設置本地描述失敗:", sdpError);

      set({ localDescription: answer.sdp || "", localICECandidates: await candidatesPromise });
    }
  };

  const setRemote = async (sdp: string, candidates: string[]) => {
    const { role } = get();

    if (role === "host") {
      const { error } = await tryCatch(
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }))
      );
      if (error) return console.error("設置遠端描述失敗:", error);
      set({ remoteDescription: sdp });
    }

    if (role === "client") {
      const { error } = await tryCatch(
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }))
      );
      if (error) return console.error("設置遠端描述失敗:", error);
      set({ remoteDescription: sdp });
    }

    await Promise.all(
      candidates.map(async (candidate) => {
        const { error } = await tryCatch(peerConnection.addIceCandidate(new RTCIceCandidate({ candidate })));
        if (error) console.error("添加 ICE 候選失敗:", error);
      })
    );

    set({ remoteICECandidates: candidates });
  };

  const connect = async (): Promise<null | string> => {
    const { role } = get();

    if (role === "host") {
      const channel = peerConnection.createDataChannel("chat");
      channel.onopen = () => console.log("DataChannel 開啟");
      channel.onmessage = (e) => console.log("收到訊息:", e.data);
    }

    if (role === "client") {
      peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        channel.onopen = () => console.log("DataChannel 開啟");
        channel.onmessage = (e) => console.log("收到訊息:", e.data);
      };
    }

    // TODO : 檢查參數是否齊全、創建 DataChannel、監聽 onconnectionstatechange 在斷線時呼叫 reset
    return null;
  };

  return {
    role: "host",
    setRole,

    localDescription: "",
    localICECandidates: [],
    getLocal,

    remoteDescription: "",
    remoteICECandidates: [],
    setRemote,

    status: "等待參數",
    connect,
  };
});

export { useWebRTC };
