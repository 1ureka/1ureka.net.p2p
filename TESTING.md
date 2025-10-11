# Testing History

> This document records internal testing scenarios and results for quality assurance and regression tracking. These tests validate real-world use cases to ensure the application performs reliably across different network environments and service types.

---

## Testing Environment

All tests are conducted in real-world network conditions without simulated environments. This ensures validation of:

- **NAT traversal** across different ISP configurations
- **WebRTC performance** under actual internet conditions
- **Protocol reliability** with various TCP service implementations

---

## Test Cases

### 1. Vite Development Server with HMR

**Objective**: Validate that web development servers with Hot Module Replacement work seamlessly across the P2P connection.

**Test Scenario**:
- Host runs a Vite development server locally (default configs)
- Client creates mapping `127.0.0.1:5173 => ::1:5173`
- Client opens `http://127.0.0.1:5173` in multiple browser windows simultaneously
- Host modifies `App.tsx` source code to trigger HMR updates
- Verify page loads, static assets (CSS, JS, images), hard refresh, and HMR WebSocket stability
- Verify changes reflect instantly without page refresh across all browser windows

**Status**: ✅ Passed on v1.0.0-alpha.8

---

### 2. Multiple Port Mappings

**Objective**: Confirm that multiple client mappings can point to the same host service without conflicts.

**Test Scenario**:
- Host runs a web service on port `3000`
- Client creates two mappings both targeting the same service: `127.0.0.1:3000 => 127.0.0.1:3000` and `127.0.0.1:3001 => 127.0.0.1:3000`
- Client accesses both `http://127.0.0.1:3000` and `http://127.0.0.1:3001`
- Perform concurrent requests on both ports
- Verify both URLs return identical responses, Socket Pair uniqueness is maintained (different `srcPort` values), and no connection interference or data corruption occurs

**Status**: ✅ Passed on v1.0.0-alpha.8

---

### 3. Host Rules Mid-Session Updates

**Objective**: Verify that changing Host rules during an active session correctly applies to new connection requests.

**Test Scenario**:
- Host establishes a session with default rules
- Client creates a mapping and establishes TCP connection(s)
- Host modifies rules (e.g., disables `allowIPv4Local`)
- Client attempts to establish new connections
- Verify new connection requests are evaluated against updated rules while existing connections remain unaffected

**Status**: ✅ Passed on v1.0.0-alpha.6

---

### 4. Ollama HTTP Server with Streaming

**Objective**: Validate streaming response handling for AI/LLM services with high concurrency.

**Test Scenario**:
- Host runs Ollama service on port `11434` and Express server on port `3000` providing web UI and API to Ollama
- Client creates mapping `127.0.0.1:3000 => 127.0.0.1:3000`
- Client accesses web UI at `http://127.0.0.1:3000` and **opens four browser tabs simultaneously**, each submitting concurrent text generation requests with streaming enabled
- Verify streaming behavior: response chunks arrive progressively (not buffered), Server-Sent Events (SSE) headers are properly transmitted, long-running requests (up to 2 minutes) remain stable, and no data corruption or mixed responses occur between concurrent streams

**Status**: ✅ Passed on v1.0.0-alpha.8

---

### 5. PostgreSQL Database Access

**Objective**: Verify that TCP-based database connections work correctly, including connection pooling and transaction handling.

**Test Scenario**:
- Host runs PostgreSQL database on port `5432` and Adminer (web-based DB client) on port `8080`
- Client creates two mappings: `127.0.0.1:5432 => 127.0.0.1:5432` (PostgreSQL) and `127.0.0.1:8080 => 127.0.0.1:8080` (Adminer)
- Client accesses Adminer at `http://127.0.0.1:8080` via browser and logs in using `localhost` as server (routes through P2P mapping to Host's PostgreSQL)
- Perform database CRUD operations (Create, Read, Update, Delete) and verify data persistence and integrity

**Status**: ⏳ Not Yet Tested

---

### 6. VS Code Code Server

**Objective**: Validate remote development environment access, including file editing, terminal, and extensions.

**Test Scenario**:
- Host runs code-server (VS Code in browser)
- Client creates mapping to access it remotely
- Test full IDE functionality over P2P connection including file editing, terminal responsiveness, extension marketplace access, and WebSocket stability

**Status**: ⏳ Not Yet Planned

---

### 7. Minecraft Dedicated Server

**Objective**: Validate real-time gaming performance under cross-region latency with heavy modpacks.

**Test Scenario**:
- Host runs Minecraft dedicated server in **Taiwan** with a large modpack (resource-intensive)
- Client connects from **Canada** through P2P mapping
- Continuous gameplay session lasting **at least 30 minutes**
- Perform typical gameplay activities: movement and exploration, block breaking/placing, inventory management, and chat functionality
- Verify no rubber-banding, immediate feedback, connection stability, no disconnects or timeouts, and acceptable latency for gameplay

**Status**: ✅ Passed on v1.0.0-alpha.5
