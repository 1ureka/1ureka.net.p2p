/* eslint-disable @typescript-eslint/no-explicit-any */

enum IPCChannel {
  AdapterStartHost = "adapter.start.host",
  AdapterCreateRule = "adapter.create.rule",
  AdapterRemoveRule = "adapter.remove.rule",

  AdapterStartClient = "adapter.start.client",
  AdapterCreateMapping = "adapter.create.mapping",
  AdapterRemoveMapping = "adapter.remove.mapping",

  AdapterStop = "adapter.stop",

  AdapterLogsChange = "adapter.logs.change",
  AdapterSocketChange = "adapter.socket.change",
  AdapterMappingChange = "adapter.mapping.change",
  AdapterRuleChange = "adapter.rule.change",

  FromTCP = "data.from.tcp",
  FromRTC = "data.from.rtc",
  OSInfo = "os.info",
  DeveloperTools = "developer.tools",
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
