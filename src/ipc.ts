/* eslint-disable @typescript-eslint/no-explicit-any */

enum IPCChannel {
  AdapterStartHost = "adapter.start.host",
  AdapterChangeRules = "adapter.change.rules",
  AdapterStartClient = "adapter.start.client",
  AdapterCreateMapping = "adapter.create.mapping",
  AdapterRemoveMapping = "adapter.remove.mapping",
  AdapterStop = "adapter.stop",

  AdapterInstanceChange = "adapter.instance.change",
  AdapterLogsChange = "adapter.logs.change",
  AdapterSocketChange = "adapter.socket.change",
  AdapterMappingChange = "adapter.mapping.change",
  AdapterRuleChange = "adapter.rule.change",

  FromTCP = "data.from.tcp",
  FromRTC = "data.from.rtc",

  OSInfo = "utils.os.info",
  PrettyFormat = "utils.pretty.format",
  DeveloperTools = "utils.developer.tools",
  OpenExternalLink = "utils.open.external.link",
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
