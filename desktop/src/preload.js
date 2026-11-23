const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('smartguardDesktop', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  openDataDir: () => ipcRenderer.invoke('open-data-dir'),
  resetLocalData: () => ipcRenderer.invoke('reset-local-data'),
  showNotification: (payload) => ipcRenderer.invoke('show-notification', payload),
  onConfig: (cb) => ipcRenderer.on('smartguard-config', (_e, data) => cb(data)),
  onNotificationClick: (cb) =>
    ipcRenderer.on('notification-clicked', (_e, data) => cb(data)),
  onInAppNotification: (cb) => {
    const handler = (_e, data) => cb(data)
    ipcRenderer.on('in-app-notification', handler)
    return () => ipcRenderer.removeListener('in-app-notification', handler)
  },
})
