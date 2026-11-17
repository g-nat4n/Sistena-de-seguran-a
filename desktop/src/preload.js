const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('smartguardDesktop', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  openDataDir: () => ipcRenderer.invoke('open-data-dir'),
  onConfig: (cb) => ipcRenderer.on('smartguard-config', (_e, data) => cb(data)),
})
