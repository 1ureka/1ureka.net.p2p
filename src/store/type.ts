export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "failed";

export type ConnectionLogLevel = "info" | "warn" | "error";

export type ConnectionLogEntry = {
  level: ConnectionLogLevel;
  module: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};
