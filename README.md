# 1ureka.net.p2p

> [!IMPORTANT]
> **一個能讓你把任意 TCP 服務透過 WebRTC P2P 分享給遠端的桌面工具。**

我相信網路應該是自由的 ——
不該因為沒有固定 IP、沒有設定 Port Forwarding，或是不想付費買代理服務、租用伺服器，就失去分享與連線的可能性。

## 你能用它做什麼？

- 與朋友分享 **Minecraft Dedicated Server**。
- 遠端存取 **本地 HTTP/HTTPS 服務**（例如測試網站、API）。
- 讓團隊連線到 **本地工具服務**（如 Ollama、大語言模型、協作插件）。
- 以及任何基於 TCP 的遊戲或自訂協定。

## 為什麼沒有流量限制或付費方案？

因為這不是商業代理服務，而是建構在 **開放技術**（Electron、WebRTC 等）之上的工具：

- **Electron** 提供跨平台的桌面環境，免安裝網路驅動或系統層修改。
- **WebRTC** 提供 NAT 穿透、加密傳輸，確保使用者之間能直接連線。
- **Node.js 的 `net` 模組** 負責 TCP socket 的建立與轉發，讓各種基於 TCP 的協定都能被承載。

這些基礎技術本身就是自由、開放的，因此不會有人為的流量限制，也沒有額外收費。

## 與 VPN 或代理的不同

- **不會接管整個網路**：只針對你指定的 TCP 服務轉發，不會像 VPN 一樣強制改道所有流量。
- **不依賴中心化伺服器**：資料傳輸是雙方電腦直接連線，伺服器只在連線建立過程中用來交換必要的連線資訊。
- **沒有隱藏門檻**：不必綁定信用卡、不會遇到「免費額度用完」這種設計。

---

# 如何使用？

## 網路需求

只要你的網路能正常進行 **線上遊戲** 或 **視訊通話**，就能使用本工具。

- **最常見且穩定的情況**
  - 家用光纖或寬頻網路 (Wi-Fi)
  - 手機行動熱點（4G / 5G）
  - 學校或公司具備對外 IP 的網路

- **可能較難使用的情況**
  - 公用 Wi-Fi（咖啡廳、旅館等，通常會封鎖連線）
  - 同一區域網路下的兩台設備（例如同一 Wi-Fi 或行動熱點）
  - 嚴格管制的公司防火牆

## 下載與啟動

1. 前往 Releases 頁面下載最新的 **zip 壓縮檔**。
2. 解壓縮後，資料夾內會包含一個 **可執行檔** (例如 Windows 是 `*.exe`)。
3. 直接開啟該可執行檔就能啟動應用程式。
   - **所有應用資料**都會存在於解壓縮後的資料夾中，不會寫入系統。
   - 想要**移除應用**，只需刪除整個資料夾即可，無需額外清理。

## 選擇 Host 或 Client

啟動應用後，首先需要選擇角色：

- **Host 模式**
  - 適用於你要「分享服務」的情境，例如：
    - Minecraft Dedicated Server
    - 本地大語言模型服務 (比如 [ollama](https://github.com/ollama/ollama))
    - 本地協作工具服務 (比如 [Blender Mixer Addon](https://ubisoft-mixer.readthedocs.io/en/latest/index.html))

  - 你需要填寫：
    - **轉發端口**：本地 TCP 服務正在監聽的端口（例：`25565` for Minecraft）。
    - **IP 類型**：通常選擇 `127.0.0.1` 或 `::1` 即可。

  - 建立成功後，會生成一個唯一的 **Session ID**。
    - 將此 ID 分享給遠端的 Client（僅限一位）。

- **Client 模式**
  - 適用於你要「使用遠端服務」的情境，例如：
    - Minecraft Client
    - 在命令行寄送請求到遠端的本地大語言模型服務
    - 在協作工具中設置 localhost 連線

  - 你需要填寫：
    - **Session ID**：向 Host 索取並填入。
    - **Port**：指定一個本地端口（例：`25565`），應用程式會連線到此端口，實際會透過 WebRTC 傳送到 Host。

  - 送出 Join 請求後，若 Host 同意，Session 即建立完成。

## 斷線與資源管理

- 若想中斷連線，**只需關閉應用程式**。
- 所有的 Session、TCP 連線與資源都會隨應用程式進程釋放，不會殘留任何背景程序或隱藏服務。

## 一對多

本工具的 Session 是一對一設計，但若要達到 **一個 Host 同時服務多個 Client**，可以：

1. 在 Host 端 **同時開啟多個應用實例**，每個實例綁定相同的 TCP 服務端口。
2. 每個實例會生成不同的 Session ID，分別提供給不同的 Client。

---

# 應用架構

專案利用了 Electron 的 **雙進程架構**，各自負責不同的網路層級處理：

- **Transport 模組（渲染進程）**
  專注於 P2P 連線的建立與維護，處理信令交換、ICE 候選收集，以及資料在 DataChannel 上的傳遞。
  可以將它視為「通往遠端的網路管道」。

- **Adapter 模組（主進程）**
  將 TCP 協定轉換成可在 WebRTC DataChannel 上傳輸的格式，並透過 Electron 的 IPC 與 Transport 模組協同工作。
  可以將它視為「銜接本地應用程式與網路管道的接口」。

這兩個模組互相合作，使得本地 TCP 服務能透過 P2P 的方式被另一端直接存取。

## 流程圖

以下流程圖展示了 TCP 資料如何透過本系統進行傳輸：

```mermaid
sequenceDiagram
    participant AP as 本地應用
    participant CB as Client Adapter
    participant DC as WebRTC
    participant HB as Host Adapter
    participant SR as 本地服務

    AP->>CB: 收到本地應用連線請求
    CB->>CB: 分配識別碼
    CB->>DC: CONNECT 封包
    DC->>HB: CONNECT 封包
    HB->>SR: 建立新的 TCP 連線至服務

    AP->>CB: 收到應用程式的資料
    CB->>CB: 切片與封裝標頭
    CB->>DC: DATA 封包
    DC->>HB: DATA 封包
    HB->>HB: 封包解析與重組
    HB->>SR: 寫入資料到 TCP 服務

    SR->>HB: 服務回應資料
    HB->>HB: 切片與封裝標頭
    HB->>DC: DATA 封包
    DC->>CB: DATA 封包
    CB->>CB: 封包解析與重組
    CB->>AP: 寫入資料到 TCP 連線

    AP->>CB: 關閉連線
    CB->>CB: 釋放資源
    CB->>DC: CLOSE 封包
    DC->>HB: CLOSE 封包
    HB->>SR: 關閉 TCP 連線
```

---

# 核心模組：Adapter

Adapter 是應用的 **核心轉換模組**，根據不同角色的需求，分為：

- **Host**
  負責在 Client 要求時建立對應的本地 TCP 連線

- **Client**
  負責攔截本地應用的 TCP 連線需求，使本地應用認為自己直接連上實際服務。

## 為什麼需要 Adapter？

要理解 Adapter 的存在，必須先理解 **TCP socket 的本質**：

- **TCP 是雙向的資料流協定**。
  - 每建立一次連線，就會創造一個獨立的 **socket 實體**，用來維護連線狀態（序號、緩衝、重傳、關閉等）。
  - 一個應用程式可以同時開啟許多 TCP socket，例如：
    - 瀏覽器同時載入多張圖片、JS、CSS。
    - 資料庫連線池 (connection pool) 中的多條 TCP 連線，同樣指向同一個 DB 服務與 port。
    - Vite 開發伺服器 (一個前端常用的網站開發工具) 會同時出現短生命的靜態資源請求與長生命的 HMR 連線。

- **WebRTC DataChannel 的限制**
  - DataChannel 底層基於 **SCTP over DTLS over UDP**，本質上是 **訊息導向** 的，而非 TCP 那樣的連續位元流。
  - 每條 DataChannel 對應一個 SCTP stream，單個訊息大小有限制。
  - 因此在 DataChannel 上要模擬 TCP，必須有額外層：
    1. **多工 (Multiplexing)**：讓多個邏輯 TCP socket 共用同一條 DataChannel。
    2. **流式重組 (Chunker/Reassembler)**：將 TCP 的資料流切片到合適的大小再拼回來。

**Adapter 的角色**，就是為了將 DataChannel 變成一個「可承載多個 TCP socket 的虛擬線路」。

## 邏輯 Socket

Adapter 透過自訂協定中的 **識別碼與事件封包** 將單一 DataChannel 切分為多條邏輯 TCP 連線：

- **一個 socket_id = 一條 TCP 連線**
  - Host 與 Client 會共享這個 socket_id。
  - 所有與此連線相關的 `CONNECT`、`DATA`、`CLOSE` 封包，都會使用相同的 socket_id。

- **生命週期**
  - **建立 (CONNECT)**
    - Client 接收到本地 TCP 請求 → 分配 socket_id → 發送 `CONNECT` 封包 → Host 建立新的 TCP socket。
  - **傳輸 (DATA)**
    - 雙方透過 Chunker / Reassembler 傳送與接收資料。
  - **關閉 (CLOSE)**
    - 任一端發生錯誤或主動關閉 → 發送 `CLOSE` 封包 → 對端釋放資源。

> [!TIP]
> 邏輯 socket 在 Adapter 裡是一個「狀態機」，對應到真實 TCP socket 的生命周期。

## 協定設計

在 Adapter 的多工架構下，需要一個自訂協定，確保 **多連線、多訊息、多片段** 都能正確傳輸。

### 封包結構

```
Offset   Size   Field          Type      說明
────────────────────────────────────────────────────────────
[0]      1      event          Uint8     事件型別 (CONNECT, DATA, CLOSE)
[1–2]    2      socket_id      Uint16    邏輯 TCP 連線 ID
[3–4]    2      chunk_id       Uint16    一段 TCP 資料流的片段 ID
[5–6]    2      chunk_index    Uint16    本片段在訊息中的序號
[7–8]    2      total_chunks   Uint16    總片段數
[9–10]   2      payload_size   Uint16    本片段資料大小
[11– ]   N      payload        Uint8[]   真正的 TCP 資料
```

### 補充說明

- **payload_size 的設計**
  - DataChannel 單次訊息的實務上限約 **65535 bytes**。
  - 扣除協定 header 的 11 bytes，最大 payload 剛好是 **65525 bytes**。
  - 這確保 `payload_size` 可以完全由 `Uint16` 表示，無需額外擴展。

- **循環使用**
  - `socket_id` 與 `chunk_id` **MUST 實作循環使用**。
  - 上限皆為 65535，當編號達到最大值後，必須回到 0 重新分配。
  - 任何尚未釋放的 socket_id 或未完成的 chunk_id 不得被覆寫，實作方 SHOULD 確保安全回收。
  - 因此該協定能支撐同時多達 65535 條邏輯連線與 65535 個未完成的訊息。

---

# 核心模組：Transport

Transport 模組是該專案的 **P2P 實現基礎**，以 WebRTC 為核心，負責：

1. 建立並維護 **Peer-to-Peer 連線**。
2. 提供唯一的 **RTCDataChannel** 作為 TCP 隧道的承載管道。
3. 對外封裝為簡單的 **Session API**，確保生命週期清晰。
4. 提供 **插件式擴展**，用於資料轉發、監控或統計。

## 為什麼選擇 WebRTC？

雖然 Node.js/Electron 中也可以透過 TCP/UDP 直連，但在 **NAT/防火牆** 環境下往往不可行。WebRTC 的出現，正好解決了這個問題：

- **NAT Traversal**：WebRTC 內建 ICE (STUN) 機制，能在不同網路環境下盡可能建立直連。
- **可靠性**：DataChannel 基於 **SCTP over DTLS over UDP**，具備重傳、順序保證、分片處理等功能。
- **安全性**：所有資料皆透過 DTLS 加密，避免中途攔截。

但同時 WebRTC 的 API 相對繁瑣：

- 建立連線需要 SDP offer/answer、ICE candidates 的交換。
- 必須正確初始化 DataChannel，並監控其狀態。

因此，專案內封裝了一層 API，確保初始化、生命週期管理的簡單性。

## API 設計

專案採用 **Vanilla ICE 流程**，並將 **RTCPeerConnection** 與 **RTCDataChannel** 綁定在同一個生命週期。

這樣做的原因是：

- 專案並不是要實作完整的 RTC 應用（例如多媒體傳輸、多條 DataChannel）。
- 專案只需要 **一條穩定的資料通道** 來承載 TCP 封包。

```ts
const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();
```

> [!TIP]
> 這層封裝會在一開始就初始化 **RTCDataChannel** 與 **ICE Candidate 收集**。
> 上層只需要專注於角色（Host/Client）的流程。

## 插件式綁定

為了避免 WebRTC API 過於耦合，專案採用「插件式綁定」的方式，常見的操作如 **DataChannel ↔ IPC 綁定**、**監控流量**、**記錄監控資訊**，都可以被抽象為「插件」。
為了確保生命週期清晰，每個 `bindDataChannelX` 函數必須遵循以下規範：

- **自給自足**：
  呼叫 `bindDataChannelX(...)` 即表示完成了該插件的整個註冊過程。呼叫者無需額外呼叫 `unregister` 或 `close`。
- **責任範圍**：
  - `register` → 在 `onmessage`、`monkey patch send` 等事件中掛載需要的邏輯。
  - `unregister` → 必須在 `onclose` / `onerror` 自動移除監聽器、釋放自己創建的資源。

- **框架保證**：
  核心 `createWebRTCSession` 已經保證整體連線的 **主生命週期**，插件只需管理「自己多出來的部分」。
- **類似 Blender 插件機制**：
  - Blender 規範每個插件必須有 `register/unregister`。
  - 在這裡，`bindDataChannelX` 就是自帶 register/unregister 的函式，應用本身不需要知道如何清理。

### 範例：DataChannel 與 IPC 綁定

```ts
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // register
  dataChannel.onmessage = (event) => /* ...轉發到 IPC... */;
  const handleIPCMessage = (buffer: unknown) => /* ...轉發到 DataChannel... */;
  window.electron.on(event, handleIPCMessage);

  // unregister
  const cleanup = () => { window.electron.off(event, handleIPCMessage); sender.close(); };
  dataChannel.onclose = cleanup;
  dataChannel.onerror = cleanup;
};
```

### 範例：DataChannel 流量監控

```ts
const bindDataChannelMonitor = (dataChannel, onUpdate) => {
  // register
  dataChannel.addEventListener("message", (e) =>  /* 計算輸入流量 */ );
  const originalSend = dataChannel.send.bind(dataChannel);
  dataChannel.send = (data) =>  /* 計算輸出流量 */, originalSend(data);

  // unregister
  const cleanup = () => { dataChannel.send = originalSend; /* 移除監聽 */ };
  dataChannel.addEventListener("close", cleanup);
  dataChannel.addEventListener("error", cleanup);
};
```

## 信令 (Signaling)

TODO
