const { app, BrowserWindow, ipcMain, shell, Menu, Notification, nativeImage } = require('electron')
const path = require('path')
const http = require('http')
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const { loadConfig, saveConfig, dataDir, logsDir, instanceRoot, legacyDataDir } = require('./config')

let splashWindow = null
let mainWindow = null
let toastWindow = null
let localApiProcess = null
let localVisionProcess = null
let config = null
let startedApiByApp = false
let startedVisionByApp = false

// Evita duas janelas brigando pelas portas 8080/8090
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

function focusMainWindow(alertId) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  if (alertId) {
    mainWindow.webContents.send('notification-clicked', { alertId: String(alertId) })
  }
}

function closeToastWindow() {
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.close()
  }
  toastWindow = null
}

function showStyledToast({ title, body, alertId }) {
  closeToastWindow()

  const toastPath = path.join(__dirname, '..', 'toast', 'index.html')
  if (!fs.existsSync(toastPath)) {
    return false
  }

  const { width: screenW = 1280, height: screenH = 720 } =
    require('electron').screen.getPrimaryDisplay().workAreaSize
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
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  toastWindow.loadFile(toastPath, {
    query: {
      title: String(title || 'SmartGuard AI'),
      body: String(body || ''),
      alertId: alertId != null ? String(alertId) : '',
    },
  })
  toastWindow.once('ready-to-show', () => {
    if (toastWindow && !toastWindow.isDestroyed()) toastWindow.showInactive()
  })
  toastWindow.on('closed', () => {
    toastWindow = null
  })
  return true
}

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

function visionHealthCheck(timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const req = http.get('http://127.0.0.1:8090/health', { timeout: timeoutMs }, (res) => {
        resolve(res.statusCode === 200)
        res.resume()
      })
      req.on('timeout', () => { req.destroy(); resolve(false) })
      req.on('error', () => resolve(false))
    } catch {
      resolve(false)
    }
  })
}

function resolveJava() {
  const bundled = [
    path.join(process.resourcesPath || '', 'runtime', 'jre', 'bin', 'java.exe'),
    path.join(__dirname, '..', '..', 'windows', 'dist', 'runtime', 'jre', 'bin', 'java.exe'),
  ].find((p) => fs.existsSync(p))
  if (bundled) return bundled

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

function resolveVisionRoot() {
  const candidates = [
    path.join(process.resourcesPath || '', 'vision'),
    path.join(__dirname, '..', '..', 'windows', 'dist', 'vision'),
    path.join(__dirname, '..', '..', 'ai'),
  ]
  return candidates.find((p) => fs.existsSync(path.join(p, 'app', 'main.py'))) || null
}

function resolveBundledPython(visionRoot) {
  if (!visionRoot) return null
  const candidates = [
    path.join(visionRoot, 'python', 'python.exe'),
    path.join(visionRoot, 'python', 'Scripts', 'python.exe'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || null
}

function resolveSystemPython() {
  const tries = [
    ['py', ['-3', '-c', 'import sys; print(sys.executable)']],
    ['python', ['-c', 'import sys; print(sys.executable)']],
    ['python3', ['-c', 'import sys; print(sys.executable)']],
  ]
  for (const [cmd, args] of tries) {
    const r = spawnSync(cmd, args, { encoding: 'utf8', shell: true })
    if (r.status === 0) {
      const exe = (r.stdout || '').trim().split(/\r?\n/).filter(Boolean).pop()
      if (exe && fs.existsSync(exe)) return exe
    }
  }
  return null
}

function pythonHasModule(pythonExe, moduleName) {
  const r = spawnSync(pythonExe, ['-c', `import ${moduleName}`], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  })
  return r.status === 0
}

function appendLog(file, text) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.appendFileSync(file, text, 'utf8')
  } catch {
    // ignore
  }
}

function runSync(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
    ...opts,
  })
}

async function ensureVision() {
  const logs = logsDir()
  const logFile = path.join(logs, 'vision-launcher.log')

  if (await visionHealthCheck()) {
    sendSplash('splash-status', 'Vision (câmeras) já está no ar')
    return true
  }

  const visionRoot = resolveVisionRoot()
  if (!visionRoot) {
    sendSplash('splash-status', 'Pacote Vision ausente — RTSP pode falhar')
    appendLog(logFile, 'Vision root não encontrado\n')
    return false
  }

  let visionPython = resolveBundledPython(visionRoot)
  if (visionPython && !pythonHasModule(visionPython, 'uvicorn')) {
    appendLog(logFile, 'Python embutido sem uvicorn — tentando fallback\n')
    visionPython = null
  }

  if (!visionPython) {
    const systemPython = resolveSystemPython()
    if (!systemPython) {
      sendSplash(
        'splash-status',
        'Python do pacote ausente. Reinstale o SmartGuard-AI-Setup.exe completo.'
      )
      appendLog(logFile, 'Python não encontrado\n')
      return false
    }

    const venvDir = path.join(process.env.ProgramData || dataDir(), 'SmartGuard', 'vision-venv')
    visionPython = path.join(venvDir, 'Scripts', 'python.exe')
    const marker = path.join(venvDir, '.deps-rtsp-ok')
    const reqFile = path.join(visionRoot, 'requirements-rtsp.txt')

    if (!fs.existsSync(visionPython)) {
      sendSplash('splash-status', 'Preparando ambiente Vision (1ª vez)…')
      appendLog(logFile, `\n==== ${new Date().toISOString()} criando venv ====\n`)
      const created = runSync(systemPython, ['-m', 'venv', venvDir])
      if (created.status !== 0) {
        appendLog(logFile, created.stderr || created.stdout || 'falha venv\n')
        sendSplash('splash-status', 'Não foi possível criar o ambiente Vision')
        return false
      }
    }

    if (!fs.existsSync(marker) && fs.existsSync(reqFile)) {
      sendSplash('splash-status', 'Instalando suporte RTSP (pode demorar alguns minutos)…')
      appendLog(logFile, `\n==== ${new Date().toISOString()} pip install ====\n`)
      const pip = runSync(visionPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], { timeout: 180000 })
      appendLog(logFile, (pip.stdout || '') + (pip.stderr || ''))
      const deps = runSync(visionPython, ['-m', 'pip', 'install', '-r', reqFile], { timeout: 600000 })
      appendLog(logFile, (deps.stdout || '') + (deps.stderr || ''))
      if (deps.status !== 0) {
        sendSplash('splash-status', 'Falha ao instalar dependências Vision — veja o log')
        return false
      }
      fs.writeFileSync(marker, new Date().toISOString(), 'utf8')
    }
  }

  sendSplash('splash-status', 'Iniciando Vision (porta 8090)…')
  appendLog(logFile, `\n==== ${new Date().toISOString()} starting Vision ====\n`)

  const evidenceDir = path.join(dataDir(), 'evidence')
  fs.mkdirSync(evidenceDir, { recursive: true })

  localVisionProcess = spawn(
    visionPython,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8090'],
    {
      cwd: visionRoot,
      env: {
        ...process.env,
        SMARTGUARD_API_URL: 'http://127.0.0.1:8080/api',
        VISION_SERVICE_TOKEN: 'smartguard-vision-dev-token',
        VISION_PUBLIC_BASE_URL: 'http://127.0.0.1:8090',
        DETECTION_ENABLED: 'false',
        RTSP_OPEN_TIMEOUT_SECONDS: '8',
        EVIDENCE_DIR: evidenceDir,
      },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )
  startedVisionByApp = true

  localVisionProcess.stdout.on('data', (buf) => appendLog(logFile, buf.toString()))
  localVisionProcess.stderr.on('data', (buf) => appendLog(logFile, buf.toString()))
  localVisionProcess.on('exit', (code) => {
    appendLog(logFile, `\nVision exit code=${code}\n`)
    localVisionProcess = null
  })

  for (let i = 0; i < 40; i++) {
    sendSplash('splash-status', `Aguardando Vision… (${i + 1}/40)`)
    await new Promise((r) => setTimeout(r, 1000))
    if (await visionHealthCheck()) {
      sendSplash('splash-status', 'Vision pronto para câmeras RTSP')
      return true
    }
    if (!localVisionProcess) break
  }

  sendSplash('splash-status', `Vision não subiu. Log: ${logFile}`)
  return false
}

function stopStraySmartGuardProcesses() {
  // Evita reusar API/Vision de outra instalação ainda rodando na 8080/8090
  spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'smartguard-api\\.jar|uvicorn app\\.main' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
    ],
    { windowsHide: true, encoding: 'utf8' }
  )
}

function rmDirRecursive(target) {
  if (!target || !fs.existsSync(target)) return
  fs.rmSync(target, { recursive: true, force: true })
}

async function ensureLocalStack() {
  config = loadConfig()
  const dir = dataDir()
  const logs = logsDir()
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(logs, { recursive: true })

  sendSplash('splash-status', 'Preparando instalação isolada deste app…')
  sendSplash('splash-status', `Instância: ${config.instanceId}`)

  // Sempre sobe a API desta pasta/instalação (não herda usuários de outro Setup)
  sendSplash('splash-status', 'Encerrando serviços antigos na porta local…')
  stopStraySmartGuardProcesses()
  await new Promise((r) => setTimeout(r, 800))

  const java = resolveJava()
  if (!java) {
    sendSplash(
      'splash-error',
      'Java embutido não encontrado no pacote. Baixe novamente o SmartGuard-AI-Setup.exe completo.'
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

  sendSplash('splash-status', 'Abrindo banco só desta instalação…')
  const logFile = path.join(logs, 'api-launcher.log')
  appendLog(logFile, `\n==== ${new Date().toISOString()} starting API instance=${config.instanceId} data=${dir} ====\n`)

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
      VISION_BASE_URL: 'http://127.0.0.1:8090',
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

  let apiOk = false
  for (let i = 0; i < 45; i++) {
    sendSplash('splash-status', `Preparando banco e login local… (${i + 1}/45)`)
    await new Promise((r) => setTimeout(r, 1000))
    if (await healthCheck(config.apiBaseUrl)) {
      sendSplash('splash-status', 'Banco desta instalação pronto')
      apiOk = true
      break
    }
    if (!localApiProcess) break
  }

  if (!apiOk) {
    sendSplash(
      'splash-error',
      `A API local não subiu. Veja o log:\n${logFile}`
    )
    return false
  }

  await ensureVision()
  return true
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

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    const msg = `Falha ao carregar interface (${code}): ${desc}\n${url}`
    appendLog(path.join(logsDir(), 'ui-launcher.log'), `\n${new Date().toISOString()} ${msg}\n`)
    if (splashWindow && !splashWindow.isDestroyed()) {
      sendSplash('splash-error', msg)
    }
  })

  const renderer = resolveRendererIndex()
  if (renderer) {
    // loadFile + base ./ no build Electron (paths relativos)
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

function stopOwnedProcesses() {
  if (config && config.keepApiOnExit) return
  if (startedVisionByApp && localVisionProcess && !localVisionProcess.killed) {
    try { localVisionProcess.kill() } catch { /* ignore */ }
  }
  if (startedApiByApp && localApiProcess && !localApiProcess.killed) {
    try { localApiProcess.kill() } catch { /* ignore */ }
  }
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

ipcMain.handle('reset-local-data', async () => {
  stopOwnedProcesses()
  stopStraySmartGuardProcesses()
  await new Promise((r) => setTimeout(r, 500))
  rmDirRecursive(instanceRoot())
  // remove também a pasta legada compartilhada (causa do “pegar usuário de outra instalação”)
  try {
    const legacyDb = path.join(legacyDataDir(), 'seguranca_inteligente.db')
    if (fs.existsSync(legacyDb)) fs.unlinkSync(legacyDb)
  } catch {
    // ignore
  }
  return { ok: true, dataDir: dataDir() }
})

ipcMain.on('toast-dismiss', (_e, payload = {}) => {
  const alertId = payload.alertId != null ? String(payload.alertId) : ''
  const open = Boolean(payload.open)
  closeToastWindow()
  if (open) focusMainWindow(alertId)
})

function pushInAppNotification({ title, body, alertId }) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('in-app-notification', {
      title: String(title || 'ATENÇÃO · SmartGuard'),
      body: String(body || ''),
      alertId: alertId != null ? String(alertId) : '',
    })
  }
}

ipcMain.handle('show-notification', async (_e, payload = {}) => {
  const title = String(payload.title || 'ATENÇÃO · SmartGuard')
  const body = String(payload.body || '')
  const alertId = payload.alertId != null ? String(payload.alertId) : ''

  const styled = showStyledToast({ title, body, alertId })
  pushInAppNotification({ title, body, alertId })

  // Fallback nativo (bandeja) se a janela custom falhar
  if (!styled && Notification.isSupported()) {
    const iconCandidates = [
      path.join(__dirname, '..', 'assets', 'icon.png'),
      path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    ]
    const iconPath = iconCandidates.find((p) => fs.existsSync(p))
    const note = new Notification({
      title,
      body,
      icon: iconPath ? nativeImage.createFromPath(iconPath) : undefined,
      silent: false,
      urgency: 'critical',
    })
    note.on('click', () => focusMainWindow(alertId))
    note.show()
  }

  return { ok: true, styled }
})

if (gotTheLock) {
  app.on('second-instance', () => {
    focusMainWindow()
  })

  app.whenReady().then(() => {
    // Remove barra File/Edit/View/Window/Help
    Menu.setApplicationMenu(null)
    boot()

    // Hook local de teste (só em desenvolvimento / electron .)
    if (!app.isPackaged) {
      const testHook = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/__test_notify') {
          const title = 'ATENÇÃO · Movimento suspeito'
          const body = 'Se você está vendo isto, a notificação estilizada está OK.\nCâmera: Entrada'
          showStyledToast({ title, body, alertId: 'test' })
          pushInAppNotification({ title, body, alertId: 'test' })
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
          return
        }
        res.writeHead(404)
        res.end()
      })
      testHook.listen(19876, '127.0.0.1')
    }
  })

  app.on('window-all-closed', () => {
    stopOwnedProcesses()
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', () => {
    stopOwnedProcesses()
  })
}
