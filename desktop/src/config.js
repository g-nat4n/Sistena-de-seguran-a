const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { randomUUID } = require('crypto')

/**
 * Instalação local independente:
 * cada PC tem seu próprio banco SQLite e seus próprios usuários.
 */
const DEFAULTS = {
  mode: 'standalone',
  apiHost: '127.0.0.1',
  apiPort: 8080,
  useHttps: false,
  apiBaseUrl: 'http://127.0.0.1:8080/api',
  clientId: '',
  keepApiOnExit: true,
}

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function dataDir() {
  return path.join(process.env.ProgramData || app.getPath('userData'), 'SmartGuard', 'data')
}

function logsDir() {
  return path.join(process.env.ProgramData || app.getPath('userData'), 'SmartGuard', 'logs')
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

  // Modelo do produto: 1 PC = 1 banco + logins locais (sem depender de outro PC)
  if (cfg.mode === 'server' || cfg.mode === 'client' || !cfg.mode) {
    cfg.mode = 'standalone'
  }

  cfg.apiHost = '127.0.0.1'
  cfg.useHttps = false
  if (!cfg.apiPort) cfg.apiPort = 8080
  if (!cfg.clientId) cfg.clientId = randomUUID()
  if (typeof cfg.keepApiOnExit !== 'boolean') cfg.keepApiOnExit = true

  cfg.apiBaseUrl = `http://127.0.0.1:${cfg.apiPort}/api`
  cfg.dataDir = dataDir()
  cfg.logsDir = logsDir()
  saveConfig(cfg)
  return cfg
}

function saveConfig(cfg) {
  const file = configPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const toSave = { ...cfg }
  delete toSave.dataDir
  delete toSave.logsDir
  fs.writeFileSync(file, JSON.stringify(toSave, null, 2), 'utf8')
}

module.exports = { loadConfig, saveConfig, configPath, dataDir, logsDir, DEFAULTS }
