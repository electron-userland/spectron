const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spectron', {
  rendererProcess: {
    getApiKeys: async () => Object.keys(process).filter((propName) => propName[0] !== '_'),
    invoke: async (funcName, ...args) => {
      if (typeof process[funcName] === 'function') {
        return process[funcName](...args);
      }
      if (funcName === 'env') {
        return process.env[args[0]];
      }
      return process[funcName];
    },
  },
  mainProcess: {
    getApiKeys: () => ipcRenderer.invoke('spectron.mainProcess.getApiKeys'),
    invoke: (funcName, ...args) => ipcRenderer.invoke('spectron.mainProcess.invoke', funcName, ...args),
  },
  app: {
    getApiKeys: () => ipcRenderer.invoke('spectron.app.getApiKeys'),
    invoke: (funcName, ...args) => ipcRenderer.invoke('spectron.app.invoke', funcName, ...args),
  },
  browserWindow: {
    getApiKeys: async () => ipcRenderer.invoke('spectron.browserWindow.getApiKeys'),
    invoke: (funcName, ...args) => ipcRenderer.invoke('spectron.browserWindow.invoke', funcName, ...args),
  },
  webContents: {
    getApiKeys: () => ipcRenderer.invoke('spectron.webContents.getApiKeys'),
    invoke: (funcName, ...args) => ipcRenderer.invoke('spectron.webContents.invoke', funcName, ...args),
  },
});
