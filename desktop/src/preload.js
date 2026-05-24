const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('igl', {
  loadLicense: () => ipcRenderer.invoke('license:load'),
  activateLicense: (token) => ipcRenderer.invoke('license:activate', token),
  clearLicense: () => ipcRenderer.invoke('license:clear'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  apiBase: () => ipcRenderer.invoke('api:base'),
})
