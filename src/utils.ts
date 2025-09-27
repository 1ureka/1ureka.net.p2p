// code review 時，要確保這裡的代碼都是 nodeJS, browser 都能用的

type Success<T> = { data: T; error: null };
type Failure = { data: null; error: Error };
type Result<T> = Success<T> | Failure;

export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "failed";
export type ConnectionLogLevel = "info" | "warn" | "error";
export type ConnectionLogEntry = {
  level: ConnectionLogLevel;
  module: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};
