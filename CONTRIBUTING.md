# 貢獻指南

> 本文件描述專案背後的技術架構與設計理念，用以協助未來的開發與維護工作。

---

## 目錄

- [開發指南](#開發指南)
- [應用架構](#應用架構)
- [模組協作模式](#模組協作模式)
- [核心模組：Adapter](#核心模組adapter)
- [核心模組：Transport](#核心模組transport)

---

## 開發指南

### 開發環境需求

開始開發前，請確保您的系統已安裝以下工具：

- **Node.js**: v22.x 或以上版本（建議使用 LTS 版本）
- **npm**: v11.x 或以上版本（隨 Node.js 一同安裝）
- **Git**: 用於版本控制

檢查版本：
```bash
node --version  # 應輸出 v22.x 或更高
npm --version   # 應輸出 v11.x 或更高
```

### 專案設定

#### 1. 複製專案

```bash
git clone https://github.com/1ureka/1ureka.net.p2p.git
cd 1ureka.net.p2p
```

#### 2. 安裝依賴套件

```bash
npm install
```

這會安裝所有必要的依賴套件，包括：
- **Electron**: 桌面應用框架
- **React**: UI 框架
- **Material-UI**: UI 元件庫
- **Vite**: 開發伺服器與打包工具
- **TypeScript**: 型別系統
- **Vitest**: 測試框架

#### 3. 啟動開發模式

```bash
npm start
```

這會執行 `electron-forge start`，啟動以下服務：
- Vite 開發伺服器（支援 HMR 熱重載）
- Electron 主進程
- Electron 渲染進程

應用程式視窗會自動開啟，且修改程式碼後會自動重新載入。

### 專案結構

```
1ureka.net.p2p/
├── src/                          # 原始碼目錄
│   ├── main.ts                   # Electron 主進程入口
│   ├── preload.ts                # Preload Script（安全橋接層）
│   ├── ipc.ts                    # IPC 頻道定義
│   ├── utils.ts                  # 共用工具函數
│   │
│   ├── adapter/                  # Adapter 模組（主進程）
│   │   ├── adapter-host.ts       # Host 角色實作
│   │   ├── adapter-client.ts     # Client 角色實作
│   │   ├── adapter-service.ts    # Adapter 服務管理
│   │   ├── packet.ts             # 封包編碼/解碼
│   │   ├── framing.ts            # Chunking/Reassembly
│   │   ├── ip.ts                 # IP 處理與 Socket Pair
│   │   └── adapter.test.ts       # E2E 測試
│   │
│   ├── adapter-state/            # Adapter 狀態管理
│   │   ├── store.ts              # Zustand Store
│   │   ├── report.ts             # 狀態回報函數
│   │   └── handlers.ts           # IPC 處理器
│   │
│   ├── transport/                # Transport 模組（渲染進程）
│   │   ├── transport-pc.ts       # WebRTC PeerConnection 封裝
│   │   ├── transport-ipc.ts      # 插件: DataChannel ⇆ IPC 綁定
│   │   ├── transport-traffic.ts  # 插件: 流量監控綁定
│   │   ├── transport-sender.ts   # 可靠傳輸層
│   │   ├── session-host.ts       # Host Session 流程
│   │   ├── session-client.ts     # Client Session 流程
│   │   └── session-utils.ts      # 信令 API 與工具
│   │
│   ├── transport-state/          # Transport 狀態管理
│   │   ├── store.ts              # Zustand Store（含狀態機）
│   │   ├── report.ts             # 狀態回報函數
│   │   └── handlers.ts           # 使用者意圖處理器
│   │
│   └── ui/                       # UI 元件（渲染進程）
│       ├── renderer.tsx          # React 入口
│       ├── renderer.css          # 全域樣式
│       ├── tabs.ts               # 分頁狀態管理
│       ├── theme.ts              # Material-UI 主題
│       ├── components/           # 共用元件
│       ├── configs/              # 配置頁面元件
│       ├── events/               # 事件日誌頁面
│       ├── launch/               # 啟動頁面
│       ├── metrics/              # 監控頁面
│       └── session/              # 會話卡片元件
│
├── forge.config.ts               # Electron Forge 配置
├── vite.main.config.ts           # Vite 主進程配置
├── vite.preload.config.ts        # Vite Preload 配置
├── vite.renderer.config.mjs      # Vite 渲染進程配置
├── vitest.config.mjs             # Vitest 測試配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 專案依賴與腳本
├── README.md                     # 使用者指南
└── CONTRIBUTING.md               # 開發者指南（本文件）
```

### 測試

#### 執行所有測試

```bash
npm test
```

#### 執行單一測試檔案

```bash
npx vitest run src/adapter/adapter.test.ts
```

#### 測試設計理念

專案採用 **E2E 測試策略**，直接測試完整的資料流：

```typescript
// src/adapter/adapter.test.ts 範例
it("[e2e] [echo] [client→server]", async () => {
  const { hostAdapter, clientAdapter } = await createEnvironment();

  // 建立真實的 TCP Echo Server
  const echoServer = net.createServer((socket) =>
    socket.on("data", (d) => socket.write(d))
  );
  await new Promise<void>((res) => echoServer.listen(0, res));
  const echoPort = (echoServer.address() as any).port;

  // 建立映射
  await clientAdapter.handleCreateMapping(null, {
    srcAddr: "127.0.0.1",
    srcPort: 6000,
    dstAddr: "127.0.0.1",
    dstPort: echoPort,
  });

  // 測試 TCP 客戶端
  const tcpClient = net.connect(6000, "127.0.0.1");
  const result = await new Promise<string>((resolve, reject) => {
    tcpClient.on("error", reject);
    tcpClient.on("data", (data) => resolve(data.toString()));
    tcpClient.write("hello");
  });

  expect(result).toBe("hello");

  // 清理
  tcpClient.destroy();
  echoServer.close();
  hostAdapter.handleClose();
  clientAdapter.handleClose();
});
```

**測試涵蓋範圍**：
- Adapter 的封包編碼/解碼
- Chunking/Reassembly 邏輯
- 多個並行連線的正確性
- 大量資料傳輸的穩定性

### 打包與發布

#### 本地打包

```bash
npm run package
```

這會使用 Electron Forge 打包應用，產生對應平台的可執行檔：
- **Windows**: `.exe` 檔案
- **macOS**: `.app` 檔案
- **Linux**: AppImage 或 `.deb`

打包結果位於 `out/` 目錄。

#### 清理建置檔案

```bash
npm run clean
```

這會刪除 `out/`, `.vite/`, `dist/` 等暫存目錄。

#### 發布流程

<!-- TODO: 根據 .github/workflows/release.yml 更新此部分 -->

### 貢獻流程

1. Fork 本專案到您的帳號
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

**Pull Request 檢查清單**：
- [ ] 通過所有測試 (`npm test`)
- [ ] 通過 Linter 檢查 (`npm run lint`)
- [ ] 本地打包成功 (`npm run package`)
- [ ] 更新相關文件（若涉及 API 變更）
- [ ] 撰寫清晰的 commit message
- [ ] 在 PR 描述中說明變更動機與影響範圍

---

## 應用架構

專案基於 **Electron** 開發，利用其雙進程架構將網路處理分層：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Electron App                            │
├─────────────────────────────────┬───────────────────────────────┤
│        Renderer Process         │        Main Process           │
│   (Web Technologies: React)     │   (Node.js Runtime)           │
├─────────────────────────────────┼───────────────────────────────┤
│  Transport Module               │  Adapter Module               │
│  • WebRTC Peer Connection       │  • TCP Socket Management      │
│  • Signaling (HTTP API)         │  • Protocol Conversion        │
│  • DataChannel Management       │  • Packet Framing             │
│  • State Machine                │  • Rules & Mappings           │
└─────────────────────────────────┴───────────────────────────────┘
                    │                           │
                    └─────────── IPC ───────────┘
                         (Electron)
```

### 為什麼分為兩個進程？

這不僅僅是 Electron 架構的需求，更是基於**職責分離**的設計考量：

- **Transport 模組（渲染進程）**
  - **定位**：負責 P2P 連線的建立與維護。
  - **職責**：
    - 透過信令伺服器交換連線資訊（SDP、ICE candidates）。
    - 管理 RTCPeerConnection 的生命週期。
    - 提供唯一的 RTCDataChannel 作為資料傳輸管道。
  - **為何在渲染進程**：WebRTC API 原生於瀏覽器環境，使用 Electron 的渲染進程能直接存取完整的 WebRTC 功能。

- **Adapter 模組（主進程）**
  - **定位**：負責 TCP 協定與 WebRTC DataChannel 之間的轉換。
  - **職責**：
    - 建立與管理本地 TCP socket 連線。
    - 實作自訂封包協定，支援多工傳輸。
    - 根據角色（Host/Client）執行不同的適配邏輯。
  - **為何在主進程**：Node.js 的 `net` 模組提供完整的 TCP socket 控制，且主進程對系統資源有更好的管理能力。

---

## 模組協作模式

專案採用 **宣告式、單向資料流** 的架構模式，確保狀態管理的清晰性與可追蹤性。

### 核心概念

每個模組（Adapter、Transport）都遵循以下結構：

```
module-state/
 ┣ store.ts       狀態的唯一來源
 ┣ report.ts      內部 → 外部的狀態傳播
 ┗ handlers.ts    外部 → 內部的意圖處理
```

### 1. Store（宣告來源）

- **定位**：模組狀態的唯一真實來源（Single Source of Truth）。
- **特性**：
  - 對 UI 和其他模組而言是 **唯讀** 的。
  - 應該要提供訂閱機制，因此UI, CLI, 甚至是其它模組可以及時知道狀態。
  - 以該專案來說，是透過 Zustand 實作，因此可供 UI 以 hook 形式訂閱。

### 2. Report（宣告如何改變）

- **定位**：模組內部向外部傳播狀態變化與事件的管道，由模組核心邏輯或 handlers 呼叫。
- **方向**：內部 → 外部（單向）。
- **職責**：
  - 記錄日誌（info / warn / error）。
  - 更新 store 中的狀態。
  - 將 raw data 轉為 store 的型別。

### 3. Handlers（宣告意圖）

- **定位**：接收外部意圖（使用者操作、其他模組請求）並轉換為內部邏輯。
- **方向**：外部 → 內部（單向）。
- **職責**：
  - 協調模組內部邏輯執行。
  - 也可透過 report 回饋執行結果。

### 範例：Transport 的實作 (同一進程)

```typescript
// store.ts (渲染進程)
type SessionState = {
  role: "host" | "client";
  status: ConnectionStatus;
  history: ConnectionLogFormattedEntry[];
  session: Session;
  traffic: ReadonlyArray<TrafficPoint>;
};

const useSession = create<SessionState>(() => ({
  role: "host",
  status: "disconnected",
  history: [],
  session: { id: "", host: "", client: "", createdAt: "", signal: {} },
  traffic: [],
}));

// report.ts (渲染進程)
const reportStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  // 驗證狀態轉換合法性
  if (!validTransitions[current].includes(status)) {
    reportError({ message: `Invalid transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};

// handlers.ts (渲染進程)
const handleCreateSession = () => {
  reportRole("host");
  createHostSession(); // 觸發核心邏輯，其可以透過 report 回報狀態
};

// 使用者意圖：中止連線
const handleStop = () => {
  if (!reportStatus("aborting")) return; // 驗證狀態轉換，成功後會影響註冊該狀態的邏輯
  reportWarn({ message: "Stop requested by user" });
};
```

### 範例：Adapter 的實作 (雙進程)

```typescript
// store.ts (渲染進程)
type AdapterState = {
  instance: "host" | "client" | null;
  history: ConnectionLogFormattedEntry[];
  sockets: SocketPair[];
  mappings: { id: string; mapping: string; createdAt: number }[];
  rules: { id: string; pattern: string; createdAt: number }[];
};

const useAdapter = create<AdapterState>((set) => {
  // 訂閱來自主進程的 IPC 事件
  window.electron.on(IPCChannel.AdapterInstanceChange, ({ instance }) => {
    set({ instance });
  });
  // ...
});

// report.ts (主進程)
const reportInstance = (props: InstanceChangePayload) => {
  const win = getWindow();
  // 透過 IPC 發送到渲染進程
  win.webContents.send(IPCChannel.AdapterInstanceChange, props);
};

// 簡化後的核心邏輯
ipcMain.handle(IPCChannel.AdapterStartHost, () => {
  // 執行內部邏輯
  startAdapterService("host");
  // 透過 report 回報狀態
  reportInstance({ instance: "host" });
});

// handlers.ts (渲染進程)
const handleStartHostAdapter = async () => {
  // 透過 IPC 發送到主進程
  const success = await window.electron.request(IPCChannel.AdapterStartHost);
  if (!success) throw new Error("Failed to start host adapter");
};
```

### 額外範例：Http 的實作 (與該專案無關，只是示範)

```typescript
// store.ts
type HttpState = {
  posts: ReadonlyArray<PostEntry>;
  postsLoading: boolean;
  postsError: string | null;
};

const usePostsStore = create<HttpState>(() => ({
  posts: [],
  postsLoading: false,
  postsError: null,
}));

// report.ts
const reportPosts = (data: any) => {
  const posts = PostEntrySchema.array().parse(data);
  usePostsStore.setState({ posts, postsLoading: false, postsError: null });
};

const reportPostsError = (error: Error) => {
  usePostsStore.setState({ postsLoading: false, postsError: error.message });
};

const reportPostsLoading = () => {
  usePostsStore.setState({ postsLoading: true, postsError: null });
};

// handlers.ts
const handleLoadPosts = async () => {
  reportPostsLoading();
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    reportPosts(data);
  } catch (error) {
    reportPostsError(error as Error);
  }
};
```

### 優勢

1. **單向資料流**：狀態變化路徑清晰，易於追蹤與除錯。
2. **關注點分離**：狀態儲存、事件傳播、意圖處理各司其職。
3. **環境無關**：整個設計與模組運行環境無關，無論是單進程、雙進程架構甚至是網路環境都適用。

具體來說，若從 UI 層面來看，在使用該設計後，能真正意義作到 `UI = f(state)`，UI 不需要知道狀態從何而來、如何改變，只需專注於如何呈現：

從在 UI 中處理邏輯

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState([]);

useEffect(() => {
  setLoading(true);
  fetch("/api/posts")
    .then((res) => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

變成 UI 真的只是純函數

```typescript
import { usePostsStore } from "@/modules/posts/store";
import { postsHandlers } from "@/modules/posts/handlers";

export function PostList() {
  const { posts, loading, error } = usePostsStore();

  if (!posts && !loading && !error)
    return <PostsButton onClick={postsHandlers.handleLoadPosts} />;
  if (loading)
    return <Spinner />;
  if (error)
    return <ErrorBox message={error} onRetry={postsHandlers.handleLoadPosts} />;
  return <PostCards posts={posts} />;
}
```

---

## 核心模組：Adapter

Adapter 是應用的 **核心轉換模組**，負責將 TCP 協定轉換為可在 WebRTC DataChannel 上傳輸的封包格式。

### 為什麼需要 Adapter？

#### TCP 的本質

- **TCP 是雙向的資料流協定**，每個連線都是一個獨立的 socket 實體。
- 一個應用程式可以同時開啟多個 TCP socket，即使它們指向相同的目標服務。
- 範例：
  - 瀏覽器載入網頁時，會建立多個 TCP 連線來平行下載資源（HTML、CSS、JS、圖片）。
  - 資料庫連線池中有多條連線，都指向同一個資料庫服務。
  - Vite 開發伺服器會有短生命週期的靜態資源請求與長生命週期的 HMR 連線。

#### WebRTC DataChannel 的限制

- DataChannel 基於 **SCTP over DTLS over UDP**，本質上是 **訊息導向** 的。
- 每條 DataChannel 對應一個 SCTP stream，單個訊息大小有限制。
- 因此在 DataChannel 上模擬 TCP 需要額外層：
  - **多工（Multiplexing）**：讓多個邏輯 TCP socket 共用同一條 DataChannel。
  - **流式重組（Chunking/Reassembly）**：將 TCP 資料流切片到合適大小，再重組回來。

**Adapter 的角色**，就是為了將 DataChannel 變成一個「可承載多個 TCP socket 的虛擬線路」。

### 邏輯 Socket

Adapter 透過自訂協定中的 **識別碼（Socket Pair）與事件封包** 將單一 DataChannel 切分為多條邏輯 TCP 連線。

#### Socket Pair 作為識別碼

```typescript
type SocketPair = {
  srcAddr: string; // Client端的應用程式的來源 IP
  srcPort: number; // Client端的應用程式被 OS 分配的動態 Port
  dstAddr: string; // Host端服務的目標 IP
  dstPort: number; // Host端服務的目標 Port
};
```

- **一個 Socket Pair = 一條 TCP 連線**。
- `srcAddr/srcPort` 確保了每條連線的唯一性，`dstAddr/dstPort` 則使 host 能辨識目標服務。
- 所有與此連線相關的 `CONNECT`、`DATA`、`CLOSE` 封包，都會使用相同的識別碼。

#### 生命週期

```
┌──────────────────────────────────────────────────────────────┐
│  CONNECT   Client 產生 Socket Pair → 發送 CONNECT 封包        │
│            → Host 建立對應的 TCP socket                        │
├──────────────────────────────────────────────────────────────┤
│  DATA      雙方透過 Chunker/Reassembler 傳送與接收資料         │
├──────────────────────────────────────────────────────────────┤
│  CLOSE     任一端錯誤或主動關閉 → 發送 CLOSE 封包              │
│            → 對端釋放資源                                      │
└──────────────────────────────────────────────────────────────┘
```

### 協定設計

專案實作了一個自訂的應用層協定，用於在 DataChannel 上多工傳輸 TCP 連線。

#### 封包結構

| Offset  | Size | Field        | Type      | 說明                                   |
| ------- | ---- | ------------ | --------- | -------------------------------------- |
| [0]     | 1    | event        | Uint8     | 事件類型（`CONNECT`, `DATA`, `CLOSE`） |
| [1–16]  | 16   | src_addr     | Uint8[16] | 來源 IP（IPv4 映射為 IPv6 格式）       |
| [17–18] | 2    | src_port     | Uint16    | 來源 Port                              |
| [19–34] | 16   | dst_addr     | Uint8[16] | 目標 IP（IPv4 映射為 IPv6 格式）       |
| [35–36] | 2    | dst_port     | Uint16    | 目標 Port                              |
| [37–38] | 2    | stream_seq   | Uint16    | 資料流序號（用於循環分配）             |
| [39–40] | 2    | chunk_index  | Uint16    | 當前封包在資料流中的索引               |
| [41–42] | 2    | total_chunks | Uint16    | 該資料流被切分的總數                   |
| [43– ]  | N    | payload      | Uint8[]   | 實際的 TCP 資料                        |

#### 循環使用機制

- `stream_seq` **必須實作循環使用**。
- 上限為 65535，當達到最大值後，回到 0 重新分配。
- 任何尚未完成的 `stream_seq` 不得被覆寫，實作方應確保安全回收。
- 因此該協定能支撐同時多達 65535 個未完成的訊息。

### 角色實作

#### Host Adapter

- **職責**：接收 Client 的連線請求，建立對應的本地 TCP socket。
- **流程**：
  1. 接收 `CONNECT` 封包 → 解析目標位址與端口。
  2. 驗證規則（Rules）→ 確認是否允許連線。
  3. 建立 TCP socket → 連接到本地服務。
  4. 轉發 `DATA` 封包 → TCP socket ⇆ DataChannel。
  5. 處理 `CLOSE` 封包 → 釋放資源。

#### Client Adapter

- **職責**：建立虛擬 TCP 伺服器，攔截本地應用的連線請求。
- **流程**：
  1. 根據映射表（Mappings）建立 `net.Server`。
  2. 本地應用連線 → 產生 Socket Pair → 發送 `CONNECT` 封包。
  3. 轉發 `DATA` 封包 → TCP socket ⇆ DataChannel。
  4. 處理 `CLOSE` 封包 → 釋放資源。

### 傳輸流程

在一次完整的連線過程中，資料會依序經過不同模組：

| 階段        | 本地應用      | Client Adapter                  | DataChannel | Host Adapter                    | 本地服務       |
| ----------- | ------------- | ------------------------------- | ----------- | ------------------------------- | -------------- |
| **CONNECT** | 發出連線請求  | 產生 Socket Pair → 封裝 CONNECT | →           | 驗證規則 → 建立 TCP socket      | 建立連線或拒絕 |
| **DATA**    | 傳送/接收資料 | Chunker 切片 ⇆ Reassembler 重組 | ⇆           | Chunker 切片 ⇆ Reassembler 重組 | 傳送/接收資料  |
| **CLOSE**   | 關閉連線      | 釋放資源 → 發送 CLOSE           | ⇆           | 釋放資源 → 發送 CLOSE           | 關閉連線       |

---

## 核心模組：Transport

Transport 模組是專案的 **P2P 實現基礎**，以 WebRTC 為核心，負責建立與維護點對點連線。

### 為什麼選擇 WebRTC？

雖然 Node.js/Electron 可以透過 TCP/UDP 直連，但在 **NAT/防火牆** 環境下往往不可行。

WebRTC 的優勢：

- **NAT Traversal**：內建 ICE（STUN/TURN）機制，能在不同網路環境下建立直連。
- **可靠性**：DataChannel 基於 SCTP over DTLS over UDP，具備重傳、順序保證、分片處理。
- **安全性**：所有資料透過 DTLS 加密，防止中途攔截。

但 WebRTC API 相對繁瑣：

- 需要 SDP offer/answer、ICE candidates 的交換。
- 必須正確初始化 DataChannel 並監控狀態。

專案封裝了一層簡化 API，確保生命週期管理的清晰性。

### API 設計

專案採用 **Vanilla ICE 流程**，將 RTCPeerConnection 與 RTCDataChannel 綁定在同一生命週期。

```typescript
const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();
```

> [!TIP]
> 這層封裝會在一開始就初始化 **RTCDataChannel** 與 **ICE Candidate 收集**。
> 上層只需要專注於角色（Host/Client）的流程。

**為何這樣設計？**

- 專案不需要多條 DataChannel 或多媒體傳輸。
- 只需要 **一條穩定的資料通道** 來承載 TCP 封包。

### 插件式綁定

為了避免 WebRTC API 過於耦合，專案採用「插件式綁定」方式，將常見操作抽象為獨立插件。

#### 設計規範

每個 `bindDataChannelX` 函數必須遵循：

- **自給自足**：呼叫即完成整個註冊過程，無需額外清理。
- **責任範圍**：
  - `register`：掛載事件監聽器、Monkey Patch 等邏輯。
  - `unregister`：在 `onclose`/`onerror` 自動移除監聽器、釋放資源。
- **框架保證**：核心已保證連線的主生命週期，插件只需管理「自己多出來的部分」。

類似 **Blender 插件機制**：每個插件有 `register/unregister`，應用本身不需要知道如何清理。

#### 範例：DataChannel ⇆ IPC 綁定

```typescript
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // register：DataChannel → IPC
  dataChannel.onmessage = (event) => {
    window.electron.send(IPCChannel.DataChannelReceive, event.data);
  };

  // register：IPC → DataChannel
  const handleIPCMessage = (buffer: ArrayBuffer) => {
    sender.send(buffer);
  };
  window.electron.on(IPCChannel.DataChannelSend, handleIPCMessage);

  // unregister：自動清理
  const cleanup = () => {
    window.electron.off(IPCChannel.DataChannelSend, handleIPCMessage);
    sender.close();
  };
  dataChannel.onclose = cleanup;
  dataChannel.onerror = cleanup;
};
```

#### 範例：DataChannel 流量監控

```typescript
const bindDataChannelTraffic = (dataChannel: RTCDataChannel) => {
  // register：監控輸入流量
  dataChannel.onmessage = (e) => {
    const bytes = new Blob([e.data]).size;
    reportTraffic(bytes);
  };

  // register：Monkey Patch send，監控輸出流量
  const originalSend = dataChannel.send.bind(dataChannel);
  dataChannel.send = (data) => {
    const bytes = new Blob([data]).size;
    reportTraffic(bytes);
    originalSend(data);
  };

  // unregister：恢復原始方法
  const cleanup = () => {
    dataChannel.send = originalSend;
  };
  dataChannel.onclose = cleanup;
  dataChannel.onerror = cleanup;
};
```

### 信令（Signaling）

為了建立 P2P 連線，雙方必須交換連線資訊（SDP 描述與 ICE 候選）。

專案採用基於 **HTTP 的會話式信令伺服器**。

#### 會話生命週期

```
1. Host 創建會話
   POST /session
   ← { id: "abc123..." }

2. Client 加入會話
   POST /session/abc123
   ← { status: "joined" }

3. Host 發送 offer
   PUT /session/abc123/signal
   Body: { type: "offer", sdp: "...", candidate: [...] }

4. Client 長輪詢取得 offer
   GET /session/abc123?for=offer
   ← { signal: { offer: { sdp: "...", candidate: [...] } } }

5. Client 發送 answer
   PUT /session/abc123/signal
   Body: { type: "answer", sdp: "...", candidate: [...] }

6. Host 長輪詢取得 answer
   GET /session/abc123?for=answer
   ← { signal: { answer: { sdp: "...", candidate: [...] } } }

7. WebRTC 連線建立完成
```

#### 長輪詢機制

```typescript
// 長輪詢等待對方信令，伺服器端 5 秒超時，客戶端 100ms 重試
for await (const { signal } of pollingSession(id, "offer")) {
  if (signal.offer) {
    await setRemote(signal.offer.sdp, signal.offer.candidate);
    break;
  }
}
```

#### 安全性與限制

- **Redis TTL**：伺服器自動清理過期會話，避免資源洩漏。
- **無狀態設計**：信令伺服器不儲存敏感資料，僅協助交換公開連線資訊。
- **一次性使用**：每個 Session ID 僅能用於單次連線，斷開後需重新創建。

### 狀態機

Transport 模組使用 **有限狀態機（FSM）** 管理連線生命週期，確保狀態轉換的合法性與可追蹤性。

#### 狀態定義

```typescript
type ConnectionStatus =
  | "disconnected" // 未連線
  | "joining" // 正在加入/創建會話
  | "waiting" // 等待對方加入
  | "signaling" // 信令交換中
  | "connected" // 已連線
  | "aborting" // 正在中止
  | "failed"; // 連線失敗
```

#### 狀態轉換規則

```typescript
const validTransitions: Record<ConnectionStatus, ConnectionStatus[]> = {
  disconnected: ["joining"],
  joining: ["waiting", "failed", "aborting"],
  waiting: ["signaling", "failed", "aborting"],
  signaling: ["connected", "failed", "aborting"],
  connected: ["failed", "aborting"],
  aborting: ["failed"],
  failed: ["disconnected"],
};
```

#### 狀態轉換驗證

```typescript
const reportStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  // 檢查是否為合法轉換
  if (!validTransitions[current].includes(status)) {
    reportError({ message: `Invalid transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};
```

#### 狀態流程圖

```
┌──────────────┐
│ disconnected │ ← 初始狀態
└──────┬───────┘
       │ handleCreateSession / handleJoinSession
       ▼
┌──────────────┐
│   joining    │ ← 創建/加入會話
└──────┬───────┘
       │ (Host only)
       ▼
┌──────────────┐
│   waiting    │ ← 等待對方加入
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  signaling   │ ← 交換 SDP 與 ICE candidates
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  connected   │ ← DataChannel 開啟成功
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────┐
│   aborting   │ ──→ │  failed   │ ← 錯誤或使用者中止
└──────────────┘     └─────┬─────┘
                           │ handleLeave
                           ▼
                     ┌──────────────┐
                     │ disconnected │
                     └──────────────┘
```

---

## 結語

本文件描述了專案的核心技術架構，包括雙進程設計、模組協作模式、Adapter 與 Transport 的實作細節。

希望這份文件能幫助未來的維護者快速理解專案結構，並在此基礎上進行擴展與優化。

如有任何問題或建議，歡迎提交 Issue 或 Pull Request。
