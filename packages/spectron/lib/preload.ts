/* eslint-disable no-restricted-syntax,guard-for-in */
import { contextBridge, ipcRenderer } from 'electron';

type RendererProcessFunction = (this: NodeJS.Process, ...args: unknown[]) => unknown;

contextBridge.exposeInMainWorld('spectron', {
  rendererProcess: {
    getApiKeys: async () => {
      const keys = [];

      for (const key in process) {
        keys.push(key);
      }
      return Promise.resolve(keys.filter((propName) => propName[0] !== '_'));
    },
    invoke: async (funcName: string, ...args: unknown[]) => {
      const processProp = process[funcName as keyof NodeJS.Process];
      if (typeof processProp === 'function') {
        return Promise.resolve((processProp as RendererProcessFunction).apply(process, args));
      }
      if (funcName === 'env') {
        return Promise.resolve(process.env[(args as string[])[0]]);
      }
      return Promise.resolve(processProp);
    },
  },
  mainProcess: {
    getApiKeys: () => ipcRenderer.invoke('spectron.mainProcess.getApiKeys'),
    invoke: (funcName: string, ...args: unknown[]) =>
      ipcRenderer.invoke('spectron.mainProcess.invoke', funcName, ...args),
  },
  app: {
    getApiKeys: () => ipcRenderer.invoke('spectron.app.getApiKeys'),
    invoke: (funcName: string, ...args: unknown[]) => ipcRenderer.invoke('spectron.app.invoke', funcName, ...args),
  },
  browserWindow: {
    getApiKeys: () => ipcRenderer.invoke('spectron.browserWindow.getApiKeys'),
    invoke: (funcName: string, ...args: unknown[]) =>
      ipcRenderer.invoke('spectron.browserWindow.invoke', funcName, ...args),
  },
  webContents: {
    getApiKeys: () => ipcRenderer.invoke('spectron.webContents.getApiKeys'),
    invoke: (funcName: string, ...args: unknown[]) =>
      ipcRenderer.invoke('spectron.webContents.invoke', funcName, ...args),
  },
});
