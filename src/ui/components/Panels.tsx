import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { useCallback, useRef, useState } from "react";
import { startSession } from "@/transport/session";
import { useSession } from "@/transport/store";
import { IPCChannel } from "@/ipc";

import { LayoutBox, LayoutButton, LayoutRow, LayoutText, LayoutTitle } from "@/ui/components/Layout";
import { NumberProperty, TextProperty } from "@/ui/components/Property";
import { ConnectionIndicator } from "@/ui/components/ConnectionIndicator";
import { ConnectionLogs } from "@/ui/components/ConnectionLogs";

const SessionPanel = () => {
  const session = useSession((state) => state.session);
  const status = useSession((state) => state.status);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(session.id || "");
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [session.id]);

  return (
    <LayoutBox sx={{ "& > div": { gap: 1.5 } }}>
      <LayoutRow sx={{ alignItems: "baseline", gridTemplateColumns: "auto 1fr auto" }}>
        <ConnectionIndicator status={status} />
        <LayoutTitle>Session</LayoutTitle>
        <LayoutText>
          {session.status === "waiting" ? "waiting for join" : session.status === "joined" ? "joined" : "signaling"}
        </LayoutText>
      </LayoutRow>

      <LayoutBox sx={{ "& > div": { gap: 2 } }}>
        <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "70px 1fr", gap: 1 }}>
          <LayoutText>
            <b>Host:</b>
          </LayoutText>
          <LayoutText>{session.host || "N/A"}</LayoutText>
        </LayoutRow>

        <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "70px 1fr", gap: 1 }}>
          <LayoutText>
            <b>Client:</b>
          </LayoutText>
          <LayoutText>{session.client || "N/A"}</LayoutText>
        </LayoutRow>
      </LayoutBox>

      <LayoutBox sx={{ "& > div": { gap: 2 } }}>
        <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "70px 1fr auto", gap: 1 }}>
          <LayoutText>
            <b>ID:</b>
          </LayoutText>
          <LayoutText>{session.id || "N/A"}</LayoutText>
          <LayoutButton onClick={handleCopy} sx={{ my: 0, p: 0.5, minWidth: 0 }}>
            {copied ? <DoneRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
          </LayoutButton>
        </LayoutRow>

        <LayoutRow sx={{ alignItems: "center", gridTemplateColumns: "100px 1fr", gap: 1 }}>
          <LayoutText>
            <b>Created at:</b>
          </LayoutText>
          <LayoutText>{new Date(session.createdAt).toLocaleString()}</LayoutText>
        </LayoutRow>
      </LayoutBox>

      <LayoutButton disabled>Leave</LayoutButton>
    </LayoutBox>
  );
};

const HostPanel = () => {
  const status = useSession((state) => state.status);
  const [port, setPort] = useState(3000);

  const handleClick = useCallback(async () => {
    const result = await startSession();
    if (result) window.electron.send(IPCChannel.AdapterStart, port, "host");
  }, [port]);

  return (
    <LayoutBox>
      <LayoutTitle>Create Session (Host)</LayoutTitle>
      <LayoutText>
        As the <b>Host</b>, you will share local TCP services for others to use. After creating a session, a unique
        Session ID will be generated to share with Clients. You can manage access rules for services like
        <b>127.0.0.1:25565</b> (Minecraft), <b>192.168.*:*</b> (internal network), or <b>*:*</b> (VPN mode).
      </LayoutText>

      <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />
      <LayoutButton onClick={handleClick} disabled={status === "connected"} loading={status === "connecting"}>
        Create Session
      </LayoutButton>
    </LayoutBox>
  );
};

const ClientPanel = () => {
  const status = useSession((state) => state.status);
  const [sessionId, setSessionId] = useState("");
  const [port, setPort] = useState(3000);

  const handleClick = useCallback(async () => {
    const result = await startSession(sessionId);
    if (result) window.electron.send(IPCChannel.AdapterStart, port, "client");
  }, [port, sessionId]);

  return (
    <LayoutBox>
      <LayoutTitle>Join Session (Client)</LayoutTitle>
      <LayoutText>
        As the <b>Client</b>, you will use remote services shared by the Host as if they were local. Enter the Session
        ID provided by the Host to establish connection. You can configure local port mappings like{" "}
        <b>localhost:25565 &rArr; 127.0.0.1:25565</b> to connect local apps to remote Minecraft servers.
      </LayoutText>

      <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />
      <TextProperty value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Enter Session ID" />
      <LayoutButton
        onClick={handleClick}
        disabled={status === "connected" || sessionId.trim() === ""}
        loading={status === "connecting"}
      >
        Join Session
      </LayoutButton>
    </LayoutBox>
  );
};

const LogPanel = () => {
  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
      <LayoutTitle>Connection Logs</LayoutTitle>
      <LayoutText>
        Real-time logs showing connection events, session status changes, and diagnostic information to help
        troubleshoot any connection issues.
      </LayoutText>

      <LayoutBox sx={{ my: 1, "& > div": { gridTemplateRows: "1fr" } }}>
        <ConnectionLogs />
      </LayoutBox>
    </LayoutBox>
  );
};

export { SessionPanel, HostPanel, ClientPanel, LogPanel };
