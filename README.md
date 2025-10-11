# 1ureka.net.p2p

> **Share any TCP service — from Minecraft to AI APIs — directly, securely, and without configuration.**

The internet should be free and accessible —
you shouldn't lose the ability to share and connect just because you don't have a static IP, haven't set up port forwarding, or don't want to pay for proxy services or rent a server.

## What can you do with it?

- Share your **Minecraft Dedicated Server** or any TCP-based game server with friends.
- **Access your home development environment** from a remote laptop — whether it's a **Vite, Next.js, or Laravel** project you're testing.
- Let your team **connect to Jupyter Notebook or Code Server** running on your machine to code, debug, or analyze together.
- Share your **local AI, LLM, or Stable Diffusion API** so your team can use your language models or image generation services remotely.
- Connect to your **self-hosted collaboration platforms** like **Mattermost, Wiki.js, or Penpot** for real-time editing and discussion.
- Securely **access internal network resources** from outside — like your home NAS, company databases, or intranet sites.

## Why It’s Free — No Bandwidth Limits, No Paid Plans

Because this isn't a commercial proxy service — it's a tool built on **open technologies**:

- **Electron**: Cross-platform desktop environment with no network drivers or system modifications required.
- **WebRTC**: Built-in NAT traversal and end-to-end encryption for secure, direct peer-to-peer connections.
- **Node.js `net` module**: Handles TCP socket creation and forwarding, supporting all TCP protocols.

These technologies are free and open by nature, so **there are no bandwidth limits or fees**.

---

# How to Use

## Network Requirements

If your network can handle **online gaming** or **video calls**, you're good to go.

- **Works best with:**
  - Home fiber or broadband (Wi-Fi)
  - Mobile hotspots (4G / 5G)
  - School or corporate networks with public IPs

- **May have trouble with:**
  - Public Wi-Fi (cafes, hotels — often block connections)
  - Strict corporate firewalls

## Download & Launch

1. Go to the [Releases page](https://github.com/1ureka/1ureka.net.p2p/releases) and download the latest **zip file**.
2. Extract it — you'll find an **executable** inside (e.g., `*.exe` on Windows).
3. Run the executable to launch the app.
   - **All app data** stays in the extracted folder — nothing is written to your system.
   - To **uninstall**, just delete the folder. No cleanup needed.

## Establishing a Connection

Not sure where to start? Check out the [Use Cases](#use-cases) section below.

| Role   | Session Setup                                                                                                      | Management                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Host   | Once launched, the signaling server generates a unique **Session ID**. Share this ID with the Client.              | **Rule Management**: Dynamically configure access scope (see [Host Rules](#host-rules) below).                |
| Client | Obtain the **Session ID** from the Host, send a join request, and wait for Host approval to establish the session. | **Mapping Management**: Dynamically add/remove port mappings (see [Client Mappings](#client-mappings) below). |

### Host Rules

The Host can control which network ranges the Client can access using the following options (visible after session creation):

| Boolean          | Matches                                         | Description                              |
| ---------------- | ----------------------------------------------- | ---------------------------------------- |
| `allowIPv4Local` | `127.0.0.0/8`                                   | Allow localhost TCP services             |
| `allowIPv6Local` | `::1`                                           | Allow IPv6 localhost services            |
| `allowLAN`       | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Allow LAN, corporate intranet, NAS, etc. |

> [!TIP]
>
> - Only `allowIPv4Local` is enabled by default.
> - **Changing rules mid-session won't affect existing connections** — only new ones.

### Client Mappings

After the session is established, the Client can define port mappings to control how local TCP traffic is forwarded. Mappings can be added or removed at any time during the session.

Each mapping follows this format:

```
<local_address>:<local_port> => <remote_address>:<remote_port>
```

The left side is where your local app connects, and the right side is the target you want the Host to reach on your behalf.

| Field          | Role                        | Example                     | Notes                                                             |
| -------------- | --------------------------- | --------------------------- | ----------------------------------------------------------------- |
| Local Address  | Client listens here         | `127.0.0.1`                 | Recommended to use loopback to ensure only local apps can connect |
| Local Port     | Port exposed on Client      | `3000`                      | Can differ from remote port                                       |
| Remote Address | Target Host will connect to | `127.0.0.1` / `192.168.x.x` | May still be blocked by Host rules                                |
| Remote Port    | Port on the target service  | `25565`, `3000`, `443`, etc | Must match the actual port of the service                         |

---

# Use Cases

## Accessing Remote Localhost Services

When the Host enables `allowIPv4Local` or `allowIPv6Local`, the Client can use the Host's local TCP services as if they were running on the Client's own machine.

| Example                             | Client Mapping                       | Result                                                                                   |
| ----------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Minecraft Dedicated Server          | `127.0.0.1:25565 => 127.0.0.1:25565` | Client can join the Host's Minecraft server directly.                                    |
| Vite / Next.js / Laravel Dev Server | `127.0.0.1:5173 => ::1:5173`         | Client can open `http://127.0.0.1:5173` in a browser to preview the Host's dev site.     |
| Jupyter Notebook / Code Server      | `127.0.0.1:8888 => 127.0.0.1:8888`   | Client can remotely access the Host's Notebook or VS Code editor for collaborative work. |
| Ollama (LLM API Server, Docker)     | `127.0.0.1:11434 => 127.0.0.1:11434` | Client can call the Host's Ollama LLM API at `http://127.0.0.1:11434/api/generate`.      |

## Accessing Remote LAN Services

If the Host enables `allowLAN`, the Client can connect to other devices on the Host's local network — like NAS, databases, or servers.

| Example                            | Client Mapping                        | Result                                                                 |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| NAS / Database                     | `127.0.0.1:3306 => 192.168.1.50:3306` | Client can access the Host's internal database or file server locally. |
| Nextcloud / OnlyOffice / Collabora | `127.0.0.1:8080 => 192.168.1.20:8080` | Client can use collaborative document services on the Host's LAN.      |

---

# Testing & Quality Assurance

This project has been validated with real-world use cases including:

- Web development servers with HMR (Vite)
- AI/LLM streaming APIs (Ollama)
- Database connections (PostgreSQL)
- Remote IDE (VS Code Code Server)
- Cross-region gaming (Minecraft with large modpacks)

For detailed testing scenarios and results, see [TESTING.md](TESTING.md).

---

# Issues & Support

If you run into any problems or bugs, feel free to report them on [GitHub Issues](https://github.com/1ureka/1ureka.net.p2p/issues).

When submitting an issue, please include as much of the following information as possible — it helps us help you faster:

- **Problem description**: What went wrong?
- **Steps to reproduce**: How can we trigger the issue?
- **Your environment**: OS version (Windows / macOS / Linux)
- **Error messages**: Screenshots or text logs, if available

Thanks for reporting — it helps us make this tool better!
