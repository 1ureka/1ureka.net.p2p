# Contributing Guide

> This document describes the technical architecture and design philosophy behind the project, helping future developers understand, extend, and maintain the codebase.

---

## Table of Contents

- [Development Guide](#development-guide)
- [Application Architecture](#application-architecture)
- [Module Collaboration Pattern](#module-collaboration-pattern)
- [Core Module: Adapter](#core-module-adapter)
- [Core Module: Transport](#core-module-transport)

---

## Development Guide

### Prerequisites

Before you begin, ensure your system has the following tools installed:

- **Node.js**: v22.x or later (LTS recommended)
- **npm**: v11.x or later (bundled with Node.js)
- **Git**: For version control

### Getting Started

#### 1. Clone the Repository

```bash
git clone https://github.com/1ureka/1ureka.net.p2p.git
cd 1ureka.net.p2p
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Start Development Server

```bash
npm start
```

This runs `electron-forge start`, which launches:

- Vite development server with HMR (Hot Module Replacement)
- Electron main process
- Electron renderer process

### Project Structure

```
1ureka.net.p2p/
├── src/                          # Source code directory
│   ├── main.ts                   # Electron main process entry
│   ├── preload.ts                # Preload script (secure bridge)
│   ├── ipc.ts                    # IPC channel definitions
│   ├── utils.ts                  # Shared utility functions
│   │
│   ├── adapter/                  # Adapter module (main process)
│   │   ├── adapter-host.ts       # Host role implementation
│   │   ├── adapter-client.ts     # Client role implementation
│   │   ├── adapter-service.ts    # Adapter service manager
│   │   ├── packet.ts             # Packet encoding/decoding
│   │   ├── framing.ts            # Chunking/Reassembly logic
│   │   ├── ip.ts                 # IP handling & Socket Pairs
│   │   └── adapter.test.ts       # E2E tests
│   │
│   ├── adapter-state/            # Adapter state management
│   │   ├── store.ts              # Zustand store
│   │   ├── report.ts             # State reporting functions
│   │   └── handlers.ts           # IPC handlers
│   │
│   ├── transport/                # Transport module (renderer process)
│   │   ├── transport-pc.ts       # WebRTC PeerConnection wrapper
│   │   ├── transport-ipc.ts      # Plugin: DataChannel ⇆ IPC binding
│   │   ├── transport-traffic.ts  # Plugin: Traffic monitoring
│   │   ├── transport-sender.ts   # Reliable transport layer
│   │   ├── session-host.ts       # Host session workflow
│   │   ├── session-client.ts     # Client session workflow
│   │   └── session-utils.ts      # Signaling API & utilities
│   │
│   ├── transport-state/          # Transport state management
│   │   ├── store.ts              # Zustand store (with FSM)
│   │   ├── report.ts             # State reporting functions
│   │   └── handlers.ts           # User intent handlers
│   │
│   └── ui/                       # UI components (renderer process)
│       ├── renderer.tsx          # React entry point
│       ├── renderer.css          # Global styles
│       ├── tabs.ts               # Tab state management
│       ├── theme.ts              # Material-UI theme
│       ├── components/           # Shared components
│       ├── configs/              # Configuration page
│       ├── events/               # Event log page
│       ├── launch/               # Launch page
│       ├── metrics/              # Metrics page
│       └── session/              # Session card components
│
├── forge.config.ts               # Electron Forge configuration
├── vite.main.config.ts           # Vite config for main process
├── vite.preload.config.ts        # Vite config for preload
├── vite.renderer.config.mjs      # Vite config for renderer
├── vitest.config.mjs             # Vitest test configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
├── README.md                     # User guide
└── CONTRIBUTING.md               # Developer guide (this file)
```

### Testing

#### Run All Tests

```bash
npm test
```

#### Run a Specific Test File

```bash
npx vitest run src/adapter/adapter.test.ts
```

#### Testing Philosophy

The project uses an **end-to-end testing strategy**, validating complete data flows through the system.

**Test Coverage**:

- Adapter packet encoding/decoding
- Chunking/Reassembly logic
- Multiple concurrent connections
- Large data transfer stability
- Out-of-order delivery simulation
- Scenarios with multiple mappings

### Building & Releasing

#### Local Build

```bash
npm run package
```

This uses Electron Forge to package the application for your platform:

- **Windows**: `.exe` installer
- **macOS**: `.app` bundle
- **Linux**: AppImage or `.deb` package

Build output is located in the `out/` directory.

#### Clean Build Artifacts

```bash
npm run clean
```

This removes `out/`, `.vite/`, `dist/` directories.

#### Release Workflow

The project uses **GitHub Actions** for automated releases. Currently supports Windows platform:

**Trigger a Release**:

1. Go to the `Actions` tab on GitHub
2. Select the `Release (Windows)` workflow
3. Click `Run workflow`
4. Enter version number (e.g., `v1.0.0-alpha.n`)
5. Confirm execution

**Release Artifacts**:

- Filename: `1ureka.net.p2p-win32-x64-{version}.zip`
- Contents: Windows x64 executable and related resources
- Location: GitHub Releases page

### Contribution Workflow

1. Fork the repository to your account
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Application Architecture

The project is built on **Electron**, leveraging its dual-process architecture to layer network processing:

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

### Why Two Processes?

This isn't just an Electron requirement—it's a deliberate design choice based on **separation of concerns**:

- **Transport Module (Renderer Process)**
  - **Role**: Establishes and maintains peer-to-peer connections.
  - **Responsibilities**:
    - Exchanges connection info (SDP, ICE candidates) via signaling server.
    - Manages RTCPeerConnection lifecycle.
    - Provides a single RTCDataChannel as the data transport pipeline.
  - **Why Renderer**: WebRTC APIs are native to browser environments. Electron's renderer process offers direct access to the full WebRTC stack.

- **Adapter Module (Main Process)**
  - **Role**: Translates between TCP protocol and WebRTC DataChannel.
  - **Responsibilities**:
    - Creates and manages local TCP socket connections.
    - Implements custom packet protocol for multiplexing.
    - Executes role-specific logic (Host/Client).
  - **Why Main**: Node.js's `net` module provides full TCP socket control, and the main process has better system resource management.

---

## Module Collaboration Pattern

The project follows a **declarative, unidirectional data flow** architecture, ensuring clarity and traceability in state management.

### Core Concepts

Every module (Adapter, Transport) follows this structure:

```
module-state/
 ┣ store.ts       Single source of truth
 ┣ report.ts      Internal → External state propagation
 ┗ handlers.ts    External → Internal intent processing
```

### 1. Store (Declare the Source)

- **Role**: The single source of truth for module state.
- **Characteristics**:
  - **Read-only** for UI and other modules.
  - Should provide a subscription mechanism so UI, CLI, or even other modules can react to state changes.
  - In this project, implemented via Zustand, allowing UI to subscribe via hooks.

### 2. Report (Declare How It Changes)

- **Role**: A channel for propagating state changes and events from inside the module to the outside, called by core logic or handlers.
- **Direction**: Internal → External (unidirectional).
- **Responsibilities**:
  - Log events (info / warn / error).
  - Update state in the store.
  - Transform raw data into store types.

### 3. Handlers (Declare Intent)

- **Role**: Receives external intents (user actions, requests from other modules) and translates them into internal logic.
- **Direction**: External → Internal (unidirectional).
- **Responsibilities**:
  - Coordinate execution of internal module logic.
  - Can also report execution results back via report.

### Example: Transport Implementation (Single Process)

```typescript
// store.ts (Renderer Process)
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

// report.ts (Renderer Process)
const reportStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  // Validate state transition
  if (!validTransitions[current].includes(status)) {
    reportError({ message: `Invalid transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};

// handlers.ts (Renderer Process)
const handleCreateSession = () => {
  reportRole("host");
  createHostSession(); // Triggers core logic, which can report state via report
};

// User intent: Abort connection
const handleStop = () => {
  if (!reportStatus("aborting")) return; // Validate transition; success affects logic listening to this state
  reportWarn({ message: "Stop requested by user" });
};
```

### Example: Adapter Implementation (Dual Process)

```typescript
// store.ts (Renderer Process)
type AdapterState = {
  instance: "host" | "client" | null;
  history: ConnectionLogFormattedEntry[];
  sockets: SocketPair[];
  mappings: { id: string; mapping: string; createdAt: number }[];
  rules: { id: string; pattern: string; createdAt: number }[];
};

const useAdapter = create<AdapterState>((set) => {
  // Subscribe to IPC events from main process
  window.electron.on(IPCChannel.AdapterInstanceChange, ({ instance }) => {
    set({ instance });
  });
  // ...
});

// report.ts (Main Process)
const reportInstance = (props: InstanceChangePayload) => {
  const win = getWindow();
  // Send to renderer via IPC
  win.webContents.send(IPCChannel.AdapterInstanceChange, props);
};

// Simplified core logic
ipcMain.handle(IPCChannel.AdapterStartHost, () => {
  // Execute internal logic
  startAdapterService("host");
  // Report state via report
  reportInstance({ instance: "host" });
});

// handlers.ts (Renderer Process)
const handleStartHostAdapter = async () => {
  // Send to main process via IPC
  const success = await window.electron.request(IPCChannel.AdapterStartHost);
  if (!success) throw new Error("Failed to start host adapter");
};
```

### Bonus Example: HTTP Implementation (For Illustration Only)

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

### Advantages

1. **Unidirectional Data Flow**: State changes follow a clear path, making debugging and tracing straightforward.
2. **Separation of Concerns**: State storage, event propagation, and intent handling each have distinct responsibilities.
3. **Environment-Agnostic**: The design works regardless of the runtime environment—single process, dual process, or even distributed systems.

From a UI perspective, this design truly achieves `UI = f(state)`. The UI doesn't need to know where state comes from or how it changes—it just renders what it receives.

Before: Logic scattered in UI

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

After: UI as a pure function

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

## Core Module: Adapter

The Adapter is the **heart of protocol translation**, converting TCP connections into packets suitable for transmission over WebRTC DataChannel.

### Why Do We Need an Adapter?

#### The Nature of TCP

- **TCP is a bidirectional stream protocol**, where each connection is an independent socket.
- Applications can open multiple TCP sockets simultaneously, even to the same service.
- Examples:
  - Browsers create multiple TCP connections to download resources in parallel (HTML, CSS, JS, images).
  - Database connection pools maintain multiple connections to the same database.
  - Vite dev servers handle short-lived static asset requests alongside long-lived HMR connections.

#### WebRTC DataChannel Limitations

- DataChannel is built on **SCTP over DTLS over UDP**, making it fundamentally **message-oriented**.
- Each DataChannel maps to a single SCTP stream, with size limits on individual messages.
- To emulate TCP over DataChannel, we need additional layers:
  - **Multiplexing**: Share one DataChannel among multiple logical TCP sockets.
  - **Chunking/Reassembly**: Split TCP streams into manageable chunks and reassemble them on the other side.

**The Adapter's role** is to turn a DataChannel into a "virtual wire" capable of carrying multiple TCP sockets.

### Logical Sockets

The Adapter uses **Socket Pairs as identifiers** combined with event packets to multiplex multiple logical TCP connections over a single DataChannel.

#### Socket Pair as Identifier

```typescript
type SocketPair = {
  srcAddr: string; // Client-side application source IP
  srcPort: number; // Dynamically assigned port by OS on client
  dstAddr: string; // Target service IP on host
  dstPort: number; // Target service port on host
};
```

- **One Socket Pair = One TCP connection**.
- `srcAddr/srcPort` ensures uniqueness for each connection, while `dstAddr/dstPort` lets the host identify the target service.
- All `CONNECT`, `DATA`, and `CLOSE` packets related to this connection use the same identifier.

#### Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│  CONNECT   Client generates Socket Pair → Sends CONNECT      │
│            → Host creates corresponding TCP socket           │
├──────────────────────────────────────────────────────────────┤
│  DATA      Both sides send/receive via Chunker/Reassembler   │
├──────────────────────────────────────────────────────────────┤
│  CLOSE     Either side errors or closes → Sends CLOSE packet │
│            → Peer releases resources                         │
└──────────────────────────────────────────────────────────────┘
```

### Protocol Design

The project implements a custom application-layer protocol for multiplexing TCP connections over DataChannel.

#### Packet Structure

| Offset  | Size | Field        | Type      | Description                                    |
| ------- | ---- | ------------ | --------- | ---------------------------------------------- |
| [0]     | 1    | event        | Uint8     | Event type (`CONNECT`, `DATA`, `CLOSE`)        |
| [1–16]  | 16   | src_addr     | Uint8[16] | Source IP (IPv4 mapped to IPv6 format)         |
| [17–18] | 2    | src_port     | Uint16    | Source port                                    |
| [19–34] | 16   | dst_addr     | Uint8[16] | Destination IP (IPv4 mapped to IPv6 format)    |
| [35–36] | 2    | dst_port     | Uint16    | Destination port                               |
| [37–38] | 2    | stream_seq   | Uint16    | Stream sequence (for circular allocation)      |
| [39–40] | 2    | chunk_index  | Uint16    | Index of this chunk in the stream              |
| [41–42] | 2    | total_chunks | Uint16    | Total chunks in this stream                    |
| [43– ]  | N    | payload      | Uint8[]   | Actual TCP data                                |

#### Circular Allocation

- `stream_seq` **must be implemented with circular reuse**.
- Max value is 65535; when reached, wraps back to 0.
- Incomplete `stream_seq` values must not be overwritten—implementations should ensure safe recycling.
- This allows up to 65535 concurrent incomplete messages.

### Role Implementations

#### Host Adapter

- **Responsibility**: Accept connection requests from client, create corresponding local TCP sockets.
- **Workflow**:
  1. Receive `CONNECT` packet → Parse target address and port.
  2. Validate against rules → Confirm if connection is allowed.
  3. Create TCP socket → Connect to local service.
  4. Forward `DATA` packets → TCP socket ⇆ DataChannel.
  5. Handle `CLOSE` packet → Release resources.

#### Client Adapter

- **Responsibility**: Create virtual TCP server, intercept local application connection requests.
- **Workflow**:
  1. Create `net.Server` based on mappings.
  2. Local app connects → Generate Socket Pair → Send `CONNECT` packet.
  3. Forward `DATA` packets → TCP socket ⇆ DataChannel.
  4. Handle `CLOSE` packet → Release resources.

### Data Flow

During a complete connection, data flows through different modules in sequence:

| Stage       | Local App     | Client Adapter                     | DataChannel | Host Adapter                       | Local Service  |
| ----------- | ------------- | ---------------------------------- | ----------- | ---------------------------------- | -------------- |
| **CONNECT** | Initiate      | Generate Socket Pair → Pack packet | →           | Validate rules → Create TCP socket | Accept/Reject  |
| **DATA**    | Send/Receive  | Chunker ⇆ Reassembler              | ⇆           | Chunker ⇆ Reassembler              | Send/Receive   |
| **CLOSE**   | Close         | Release → Send CLOSE               | ⇆           | Release → Send CLOSE               | Close          |

---

## Core Module: Transport

The Transport module is the **foundation of P2P connectivity**, built on WebRTC to establish and maintain peer-to-peer connections.

### Why WebRTC?

While Node.js/Electron can establish direct TCP/UDP connections, this often fails behind **NAT/firewalls**.

WebRTC advantages:

- **NAT Traversal**: Built-in ICE (STUN/TURN) mechanisms establish direct connections across diverse network environments.
- **Reliability**: DataChannel is built on SCTP over DTLS over UDP, providing retransmission, ordering, and fragmentation.
- **Security**: All data is encrypted via DTLS, preventing man-in-the-middle attacks.

However, WebRTC's API can be cumbersome:

- Requires exchanging SDP offer/answer and ICE candidates.
- Must properly initialize DataChannel and monitor its state.

The project wraps this complexity in a simplified API, ensuring clean lifecycle management.

### API Design

The project uses a **Vanilla ICE flow**, binding RTCPeerConnection and RTCDataChannel to the same lifecycle.

```typescript
const { getDataChannel, getLocal, setRemote, close } = createPeerConnection();
```

> [!TIP]
> This wrapper initializes both **RTCDataChannel** and **ICE Candidate gathering** upfront.
> Upper layers just focus on role-specific workflows (Host/Client).

**Why this design?**

- The project doesn't need multiple DataChannels or media streams.
- It only needs **one reliable data channel** to carry TCP packets.

### Plugin-Based Binding

To avoid tight coupling with WebRTC APIs, the project uses a "plugin-based binding" approach, abstracting common operations into independent plugins.

#### Design Spec

Each `bindDataChannelX` function must follow:

- **Self-Contained**: Calling it completes the entire registration; no external cleanup needed.
- **Scope of Responsibility**:
  - `register`: Attach event listeners, apply monkey patches, etc.
  - `unregister`: Automatically remove listeners and release resources on `onclose`/`onerror`.
- **Framework Guarantee**: Core manages the main connection lifecycle; plugins only handle their own additions.

Think of it like **Blender's addon system**: each plugin has `register/unregister`, and the app doesn't need to know how to clean up.

#### Example: DataChannel ⇆ IPC Binding

```typescript
const bindDataChannelIPC = (dataChannel: RTCDataChannel) => {
  const sender = createDataChannelSender(dataChannel);

  // register: DataChannel → IPC
  dataChannel.onmessage = (event) => {
    window.electron.send(IPCChannel.DataChannelReceive, event.data);
  };

  // register: IPC → DataChannel
  const handleIPCMessage = (buffer: ArrayBuffer) => {
    sender.send(buffer);
  };
  window.electron.on(IPCChannel.DataChannelSend, handleIPCMessage);

  // unregister: Auto cleanup
  const cleanup = () => {
    window.electron.off(IPCChannel.DataChannelSend, handleIPCMessage);
    sender.close();
  };
  dataChannel.onclose = cleanup;
  dataChannel.onerror = cleanup;
};
```

#### Example: DataChannel Traffic Monitoring

```typescript
const bindDataChannelTraffic = (dataChannel: RTCDataChannel) => {
  // register: Monitor incoming traffic
  dataChannel.onmessage = (e) => {
    const bytes = new Blob([e.data]).size;
    reportTraffic(bytes);
  };

  // register: Monkey patch send to monitor outgoing traffic
  const originalSend = dataChannel.send.bind(dataChannel);
  dataChannel.send = (data) => {
    const bytes = new Blob([data]).size;
    reportTraffic(bytes);
    originalSend(data);
  };

  // unregister: Restore original method
  const cleanup = () => {
    dataChannel.send = originalSend;
  };
  dataChannel.onclose = cleanup;
  dataChannel.onerror = cleanup;
};
```

### Signaling

To establish a P2P connection, both peers must exchange connection information (SDP descriptions and ICE candidates).

The project uses a **session-based HTTP signaling server**.

#### Session Lifecycle

```
1. Host creates session
   POST /session
   ← { id: "abc123..." }

2. Client joins session
   POST /session/abc123
   ← { status: "joined" }

3. Host sends offer
   PUT /session/abc123/signal
   Body: { type: "offer", sdp: "...", candidate: [...] }

4. Client polls for offer
   GET /session/abc123?for=offer
   ← { signal: { offer: { sdp: "...", candidate: [...] } } }

5. Client sends answer
   PUT /session/abc123/signal
   Body: { type: "answer", sdp: "...", candidate: [...] }

6. Host polls for answer
   GET /session/abc123?for=answer
   ← { signal: { answer: { sdp: "...", candidate: [...] } } }

7. WebRTC connection established
```

#### Long Polling

```typescript
// Long poll for peer signal; server timeout: 5s, client retry: 100ms
for await (const { signal } of pollingSession(id, "offer")) {
  if (signal.offer) {
    await setRemote(signal.offer.sdp, signal.offer.candidate);
    break;
  }
}
```

#### Security & Limitations

- **Redis TTL**: Server automatically cleans up expired sessions, preventing resource leaks.
- **Stateless Design**: Signaling server stores no sensitive data—only helps exchange public connection info.
- **Single-Use**: Each Session ID is valid for one connection only; must create a new session after disconnect.

### State Machine

The Transport module uses a **finite state machine (FSM)** to manage connection lifecycle, ensuring valid transitions and traceability.

#### State Definitions

```typescript
type ConnectionStatus =
  | "disconnected" // Not connected
  | "joining"      // Creating/joining session
  | "waiting"      // Waiting for peer to join
  | "signaling"    // Exchanging signaling
  | "connected"    // Connection established
  | "aborting"     // Aborting connection
  | "failed";      // Connection failed
```

#### Transition Rules

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

#### Transition Validation

```typescript
const reportStatus = (status: ConnectionStatus): boolean => {
  const { status: current } = useSession.getState();

  // Check if transition is valid
  if (!validTransitions[current].includes(status)) {
    reportError({ message: `Invalid transition from ${current} to ${status}` });
    return false;
  }

  useSession.setState({ status });
  return true;
};
```

#### State Flow Diagram

```
┌──────────────┐
│ disconnected │ ← Initial state
└──────┬───────┘
       │ handleCreateSession / handleJoinSession
       ▼
┌──────────────┐
│   joining    │ ← Creating/joining session
└──────┬───────┘
       │ (Host only)
       ▼
┌──────────────┐
│   waiting    │ ← Waiting for peer
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  signaling   │ ← Exchanging SDP & ICE candidates
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  connected   │ ← DataChannel opened successfully
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────┐
│   aborting   │ ──→ │  failed   │ ← Error or user abort
└──────────────┘     └─────┬─────┘
                           │ handleLeave
                           ▼
                     ┌──────────────┐
                     │ disconnected │
                     └──────────────┘
```

---

## Closing Thoughts

This document describes the project's core technical architecture, including dual-process design, module collaboration patterns, and implementation details of the Adapter and Transport modules.

We hope this guide helps future maintainers quickly understand the project structure and build upon it with confidence.

If you have questions or suggestions, feel free to open an Issue or Pull Request.
