const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spectron', {
  process: {
    getApiKeys: () => ipcRenderer.invoke('spectron.process.getApiKeys'),
    invoke: (funcName, ...args) => ipcRenderer.invoke('spectron.process.invoke', funcName, ...args),
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
