import { useSession, setStatus } from "@/transport-state/store";
import { reportWarn } from "@/transport-state/report";
import { createHostSession } from "@/transport/session-host";
import { createClientSession } from "@/transport/session-client";

const handleCreateSession = () => {
  useSession.setState({ role: "host" });
  createHostSession();
};

const handleJoinSession = (sessionId: string) => {
  useSession.setState({ role: "client" });
  createClientSession(sessionId);
};

const handleStop = () => {
  if (!setStatus("aborting")) return;
  reportWarn({ message: "Stop requested by user" });
};

const handleLeave = () => {
  if (!setStatus("disconnected")) return;
  useSession.setState({ session: { id: "", host: "", client: "", createdAt: "", signal: {} }, history: [] });
};

export { handleCreateSession, handleJoinSession, handleStop, handleLeave };
