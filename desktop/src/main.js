const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const http = require('http')
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const { loadConfig, saveConfig, dataDir, logsDir } = require('./config')

let splashWindow = null
let mainWindow = null
let localApiProcess = null
let config = null
let startedApiByApp = false

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    resizable: false,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  splashWindow.loadFile(path.join(__dirname, '..', 'splash', 'index.html'))
}

function sendSplash(channel, message) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send(channel, message)
  }
}

function healthCheck(baseUrl, timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const url = new URL(baseUrl.replace(/\/api\/?$/, '') + '/api/health')
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        let data = ''
        res.on('data', (c) => { data += c })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(Boolean(json && (json.status === 'UP' || json.status === 'DEGRADED') && json.database === 'UP'))
          } catch {
            resolve(res.statusCode === 200)
          }
        })
      })
      req.on('timeout', () => { req.destroy(); resolve(false) })
      req.on('error', () => resolve(false))
    } catch {
      resolve(false)
    }
  })
}

function resolveJava() {
  const which = spawnSync('where', ['java'], { encoding: 'utf8', shell: true })
  if (which.status === 0) {
    const first = which.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean)
    if (first && fs.existsSync(first)) return first
  }
  const home = process.env.JAVA_HOME
  if (home) {
    const candidate = path.join(home, 'bin', 'java.exe')
    if (fs.existsSync(candidate)) return candidate
  }
  const extras = [
    path.join(process.resourcesPath || '', 'runtime', 'jre', 'bin', 'java.exe'),
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Microsoft\\jdk-21\\bin\\java.exe',
  ]
  return extras.find((p) => fs.existsSync(p)) || null
}

function resolveApiJar() {
  const candidates = [
    path.join(process.resourcesPath || '', 'api', 'smartguard-api.jar'),
    path.join(__dirname, '..', '..', 'windows', 'dist', 'api', 'smartguard-api.jar'),
    path.join(__dirname, '..', '..', 'backend', 'target', 'smartguard-api-0.0.1-SNAPSHOT.jar'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || null
}

function appendLog(file, text) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.appendFileSync(file, text, 'utf8')
  } catch {
    // ignore
  }
}

async function ensureLocalStack() {
  config = loadConfig()
  const dir = dataDir()
  const logs = logsDir()
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(logs, { recursive: true })

  sendSplash('splash-status', 'Verificando instalação local deste PC…')
  sendSplash('splash-status', 'Cada PC tem banco e usuários próprios')

  if (await healthCheck(config.apiBaseUrl)) {
    sendSplash('splash-status', 'API local já está no ar')
    return true
  }

  const java = resolveJava()
  if (!java) {
    sendSplash(
      'splash-error',
      'Java 21 não encontrado neste PC. Instale o Eclipse Temurin 21 (JRE) e tente novamente.'
    )
    return false
  }

  const jar = resolveApiJar()
  if (!jar) {
    sendSplash(
      'splash-error',
      'API não encontrada no pacote. Rode windows\\scripts\\package-api.ps1 e gere o instalador de novo.'
    )
    return false
  }

  sendSplash('splash-status', 'Criando/abrindo banco local deste PC…')
  const logFile = path.join(logs, 'api-launcher.log')
  appendLog(logFile, `\n==== ${new Date().toISOString()} starting API ====\n`)

  localApiProcess = spawn(java, [
    '-jar', jar,
    `--server.port=${config.apiPort}`,
    '--server.address=127.0.0.1',
    `--smartguard.data-dir=${dir}`,
  ], {
    env: {
      ...process.env,
      SPRING_PROFILES_ACTIVE: 'sqlite',
      SMARTGUARD_NETWORK_MODE: 'standalone',
      SMARTGUARD_DATA_DIR: dir,
      SERVER_ADDRESS: '127.0.0.1',
      SERVER_PORT: String(config.apiPort),
      CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173,null,app://smartguard',
    },
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  startedApiByApp = true

  localApiProcess.stdout.on('data', (buf) => appendLog(logFile, buf.toString()))
  localApiProcess.stderr.on('data', (buf) => appendLog(logFile, buf.toString()))
  localApiProcess.on('exit', (code) => {
    appendLog(logFile, `\nAPI exit code=${code}\n`)
    localApiProcess = null
  })

  for (let i = 0; i < 45; i++) {
    sendSplash('splash-status', `Preparando banco e login local… (${i + 1}/45)`)
    await new Promise((r) => setTimeout(r, 1000))
    if (await healthCheck(config.apiBaseUrl)) {
      sendSplash('splash-status', 'Banco local pronto')
      return true
    }
    if (!localApiProcess) break
  }

  sendSplash(
    'splash-error',
    `A API local não subiu. Veja o log:\n${logFile}`
  )
  return false
}

function resolveRendererIndex() {
  const built = path.join(__dirname, '..', 'renderer', 'index.html')
  if (fs.existsSync(built)) return built
  return null
}

function openMainWindow() {
  const preloadData = {
    apiBaseUrl: config.apiBaseUrl,
    mode: 'standalone',
    clientId: config.clientId,
    dataDir: dataDir(),
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    show: false,
    title: 'SmartGuard AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('smartguard-config', preloadData)
  })

  const renderer = resolveRendererIndex()
  if (renderer) {
    mainWindow.loadFile(renderer, { query: { api: config.apiBaseUrl } })
  } else {
    mainWindow.loadURL(`http://127.0.0.1:5173/?api=${encodeURIComponent(config.apiBaseUrl)}`)
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close()
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function boot() {
  createSplash()
  const ok = await ensureLocalStack()
  if (!ok) return
  sendSplash('splash-status', 'Abrindo tela de login…')
  openMainWindow()
}

function stopOwnedApi() {
  if (!startedApiByApp || !localApiProcess || localApiProcess.killed) return
  if (config && config.keepApiOnExit) return
  localApiProcess.kill()
}

ipcMain.on('splash-retry', () => {
  boot()
})

ipcMain.handle('get-config', () => loadConfig())
ipcMain.handle('save-config', (_e, next) => {
  const merged = { ...loadConfig(), ...next, mode: 'standalone', apiHost: '127.0.0.1' }
  saveConfig(merged)
  config = loadConfig()
  return config
})
ipcMain.handle('open-data-dir', async () => {
  const dir = dataDir()
  fs.mkdirSync(dir, { recursive: true })
  await shell.openPath(dir)
})

app.whenReady().then(boot)

app.on('window-all-closed', () => {
  stopOwnedApi()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopOwnedApi()
})
