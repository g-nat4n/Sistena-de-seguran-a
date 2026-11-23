const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { createHash, randomUUID } = require('crypto')

/**
 * Instalação local independente:
 * cada pasta de instalação tem seu próprio banco SQLite e usuários.
 */
const DEFAULTS = {
  mode: 'standalone',
  apiHost: '127.0.0.1',
  apiPort: 8080,
  useHttps: false,
  apiBaseUrl: 'http://127.0.0.1:8080/api',
  clientId: '',
  keepApiOnExit: false,
  instanceId: '',
}

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function installRoot() {
  if (app.isPackaged) {
    return path.dirname(process.execPath)
  }
  return path.resolve(__dirname, '..')
}

function installInstanceId() {
  return createHash('sha1').update(installRoot()).digest('hex').slice(0, 12)
}

function instanceRoot() {
  const base = process.env.ProgramData || app.getPath('userData')
  return path.join(base, 'SmartGuard', 'instances', installInstanceId())
}

function dataDir() {
  return path.join(instanceRoot(), 'data')
}

function logsDir() {
  return path.join(instanceRoot(), 'logs')
}

function legacyDataDir() {
  const base = process.env.ProgramData || app.getPath('userData')
  return path.join(base, 'SmartGuard', 'data')
}

function loadConfig() {
  const file = configPath()
  let cfg = { ...DEFAULTS }
  if (fs.existsSync(file)) {
    try {
      cfg = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) }
    } catch {
      // keep defaults
    }
  }

  if (cfg.mode === 'server' || cfg.mode === 'client' || !cfg.mode) {
    cfg.mode = 'standalone'
  }

  cfg.apiHost = '127.0.0.1'
  cfg.useHttps = false
  if (!cfg.apiPort) cfg.apiPort = 8080
  if (!cfg.clientId) cfg.clientId = randomUUID()
  if (typeof cfg.keepApiOnExit !== 'boolean') cfg.keepApiOnExit = false

  cfg.instanceId = installInstanceId()
  cfg.installRoot = installRoot()
  cfg.apiBaseUrl = `http://127.0.0.1:${cfg.apiPort}/api`
  cfg.dataDir = dataDir()
  cfg.logsDir = logsDir()
  cfg.legacyDataDir = legacyDataDir()
  saveConfig(cfg)
  return cfg
}

function saveConfig(cfg) {
  const file = configPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const toSave = { ...cfg }
  delete toSave.dataDir
  delete toSave.logsDir
  delete toSave.legacyDataDir
  delete toSave.installRoot
  fs.writeFileSync(file, JSON.stringify(toSave, null, 2), 'utf8')
}

module.exports = {
  loadConfig,
  saveConfig,
  configPath,
  dataDir,
  logsDir,
  legacyDataDir,
  installInstanceId,
  installRoot,
  instanceRoot,
  DEFAULTS,
}
