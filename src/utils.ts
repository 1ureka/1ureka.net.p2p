// code review 時，要確保這裡的代碼都是 nodeJS, browser 都能用的

type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
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
