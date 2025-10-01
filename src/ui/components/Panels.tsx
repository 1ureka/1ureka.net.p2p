import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useCallback, useRef, useState } from "react";
import { startSession } from "@/transport/session";
import { useSession } from "@/transport/store";
import { IPCChannel } from "@/ipc";

import { LayoutBox, LayoutButton, LayoutRow, LayoutText, LayoutTitle } from "@/ui/components/Layout";
import { NumberProperty, TextProperty } from "@/ui/components/Property";
import { ConnectionIndicator } from "@/ui/components/ConnectionIndicator";
import { ConnectionLogs } from "@/ui/components/ConnectionLogs";
import { ConnectionSockets } from "@/ui/components/ConnectionSockets";

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

  const handleClick = useCallback(async () => {
    const result = await startSession();
    if (result) window.electron.send(IPCChannel.AdapterStartHost);
  }, []);

  return (
    <LayoutBox>
      <LayoutTitle>Create Session (Host)</LayoutTitle>
      <LayoutText>
        Share local TCP services with others. A unique Session ID will be generated for Clients to join.
      </LayoutText>

      <LayoutButton onClick={handleClick} disabled={status === "connected"} loading={status === "connecting"}>
        Create
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
    if (result) window.electron.send(IPCChannel.AdapterStartClient, port);
  }, [port, sessionId]);

  return (
    <LayoutBox>
      <LayoutTitle>Join Session (Client)</LayoutTitle>
      <LayoutText>Connect to services shared by the Host using the Session ID.</LayoutText>

      <NumberProperty value={port} onChange={(value) => setPort(value)} step={1} min={1025} max={65535} />
      <TextProperty value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Enter Session ID" />
      <LayoutButton
        onClick={handleClick}
        disabled={status === "connected" || sessionId.trim() === ""}
        loading={status === "connecting"}
      >
        Join
      </LayoutButton>
    </LayoutBox>
  );
};

const HowToChoosePanel = () => {
  const handleOpenLink = () => {
    // TODO: window.electron.openExternal("https://github.com/1ureka/1ureka.net.p2p#應用場景");
  };

  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto" } }}>
      <LayoutTitle>How to Choose?</LayoutTitle>
      <LayoutText>For details on when to create or join a session, see the guide below:</LayoutText>
      <LayoutButton onClick={handleOpenLink} endIcon={<OpenInNewRoundedIcon />}>
        Open Guide
      </LayoutButton>
    </LayoutBox>
  );
};

const LogPanel = () => {
  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
      <LayoutTitle>Connection Logs</LayoutTitle>
      <LayoutText>Real-time logs of connection events and session status changes.</LayoutText>

      <LayoutBox sx={{ "& > div": { gridTemplateRows: "1fr" } }}>
        <ConnectionLogs />
      </LayoutBox>
    </LayoutBox>
  );
};

const SocketPanel = () => {
  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
      <LayoutTitle>Active Sockets</LayoutTitle>
      <LayoutText sx={{ WebkitLineClamp: 1 }}>List of all active logical socket connections.</LayoutText>

      <LayoutBox sx={{ "& > div": { gridTemplateRows: "1fr" } }}>
        <ConnectionSockets />
      </LayoutBox>
    </LayoutBox>
  );
};

const TrafficPanel = () => {
  return (
    <LayoutBox sx={{ "& > div": { gridTemplateRows: "auto auto 1fr" } }}>
      <LayoutTitle>Network Traffic</LayoutTitle>
      <LayoutText sx={{ WebkitLineClamp: 1 }}>Monitor upload and download rates in real time.</LayoutText>
      <LayoutRow>
        <LayoutBox sx={{ "& > div": { gridTemplateRows: "1fr" } }}>{/* TODO: 傳出速率 */}</LayoutBox>
        <LayoutBox sx={{ "& > div": { gridTemplateRows: "1fr" } }}>{/* TODO: 傳入速率 */}</LayoutBox>
      </LayoutRow>
    </LayoutBox>
  );
};

export { SessionPanel, HostPanel, ClientPanel, HowToChoosePanel, LogPanel, SocketPanel, TrafficPanel };
