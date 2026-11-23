const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let toastWindow = null

function showStyledToast() {
  const { width: screenW = 1280, height: screenH = 720 } = screen.getPrimaryDisplay().workAreaSize
  const winW = 430
  const winH = 210
  const margin = 16

  toastWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: Math.max(0, screenW - winW - margin),
    y: Math.max(0, screenH - winH - margin),
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  toastWindow.loadFile(path.join(__dirname, 'toast', 'index.html'), {
    query: {
      title: 'ATENÇÃO · Movimento suspeito',
      body: 'Se você está vendo isto, a notificação estilizada está OK.\nCâmera: Entrada',
      alertId: 'test',
    },
  })
  toastWindow.once('ready-to-show', () => toastWindow.showInactive())
}

app.whenReady().then(() => {
  ipcMain.on('toast-dismiss', () => {
    if (toastWindow && !toastWindow.isDestroyed()) toastWindow.close()
    setTimeout(() => app.quit(), 200)
  })
  showStyledToast()
  console.log('styled-toast-shown')
  setTimeout(() => app.quit(), 9000)
})
