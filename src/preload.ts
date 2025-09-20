import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => listener(...args));
  },
  off: (channel: string, listener?: (...args: unknown[]) => void) => {
    if (listener) {
      ipcRenderer.off(channel, listener);
    } else {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  request: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args);
  },
});
