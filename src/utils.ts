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

export function tryCatchSync<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export function defer<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export type ConnectionLogLevel = "info" | "warn" | "error";
export type ConnectionLogEntry = {
  id: string;
  level: ConnectionLogLevel;
  module: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

// 合併連續重複的日誌條目
export function mergeRepeatedLogs(logs: ConnectionLogEntry[]): ConnectionLogEntry[] {
  const getOriginalMessage = (message: string) => message.replace(/ \(x\d+\)$/, "");

  const getLogKey = (log: ConnectionLogEntry) => `${log.level}:${log.module}:${getOriginalMessage(log.message)}`;

  const formatLog = (log: ConnectionLogEntry, count: number) =>
    count > 1
      ? { ...log, message: `${getOriginalMessage(log.message)} (x${count})` }
      : { ...log, message: getOriginalMessage(log.message) };

  return logs.reduce<ConnectionLogEntry[]>((acc, current) => {
    const last = acc[acc.length - 1];

    if (last && getLogKey(last) === getLogKey(current)) {
      // 如果與前一個日誌相同，更新計數
      const count = last.message.match(/\(x(\d+)\)$/)?.[1];
      const newCount = count ? parseInt(count) + 1 : 2;
      acc[acc.length - 1] = formatLog(current, newCount);
    } else {
      // 如果不同，直接添加
      acc.push(formatLog(current, 1));
    }

    return acc;
  }, []);
}
