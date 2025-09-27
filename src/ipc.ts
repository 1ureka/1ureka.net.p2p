/* eslint-disable @typescript-eslint/no-explicit-any */

enum IPCChannel {
  AdapterStart = "adapter.start",
  AdapterStop = "adapter.stop",
  AdapterStatus = "adapter.status",
  AdapterLogs = "adapter.logs",
  FromTCP = "data.from.tcp",
  FromRTC = "data.from.rtc",
  OSInfo = "os.info",
}

export { IPCChannel };

declare global {
  interface Window {
    electron: {
      send: (channel: IPCChannel, ...args: any[]) => void;
      on: (channel: IPCChannel, listener: (...args: any[]) => void) => void;
      off: (channel: IPCChannel, listener?: (...args: any[]) => void) => void;
      request: (channel: IPCChannel, ...args: any[]) => Promise<any>;
    };
  }
}
