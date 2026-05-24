const { app, BrowserWindow, ipcMain, shell, safeStorage } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

const LICENSE_FILE = path.join(app.getPath('userData'), 'license.enc')
const API_BASE = process.env.IGL_API_BASE || 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0a0f',
    title: 'IGL Command',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── License management ───
function decodeToken(b64) {
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function saveLicense(token) {
  if (!safeStorage.isEncryptionAvailable()) {
    await fs.writeFile(LICENSE_FILE, token, 'utf8')
    return
  }
  const encrypted = safeStorage.encryptString(token)
  await fs.writeFile(LICENSE_FILE, encrypted)
}

async function loadLicense() {
  try {
    const data = await fs.readFile(LICENSE_FILE)
    if (safeStorage.isEncryptionAvailable()) {
      try { return safeStorage.decryptString(data) }
      catch { return data.toString('utf8') }
    }
    return data.toString('utf8')
  } catch {
    return null
  }
}

async function clearLicense() {
  try { await fs.unlink(LICENSE_FILE) } catch { /* ignore */ }
}

ipcMain.handle('license:load', async () => {
  const token = await loadLicense()
  if (!token) return { valid: false }
  const payload = decodeToken(token)
  if (!payload) return { valid: false }
  return { valid: true, token, payload }
})

ipcMain.handle('license:activate', async (_e, token) => {
  const payload = decodeToken(token)
  if (!payload || !payload.user_id || !payload.email) {
    return { ok: false, error: 'Invalid token format. Copy it again from r6coaching.com/#/activate.' }
  }
  if (payload.plan !== 'champion') {
    return { ok: false, error: 'This license is not for the Champion plan.' }
  }
  await saveLicense(token)
  return { ok: true, payload }
})

ipcMain.handle('license:clear', async () => {
  await clearLicense()
  return { ok: true }
})

ipcMain.handle('open-external', async (_e, url) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url)
  }
})

ipcMain.handle('api:base', async () => API_BASE)
