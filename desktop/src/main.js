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
async function verifyLicense(token) {
  try {
    const response = await fetch(`${API_BASE}/desktop/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok || body.valid !== true) return { valid: false }
    return { valid: true, payload: { plan: body.plan, expires_at: body.expires_at } }
  } catch {
    return { valid: false, error: 'Recon 6 could not verify this license. Check your connection and try again.' }
  }
}

async function saveLicense(token) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure license storage is unavailable on this device.')
  }
  const encrypted = safeStorage.encryptString(token)
  await fs.writeFile(LICENSE_FILE, encrypted)
}

async function loadLicense() {
  try {
    const data = await fs.readFile(LICENSE_FILE)
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(data)
    }
    return null
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
  const result = await verifyLicense(token)
  if (!result.valid) await clearLicense()
  return result
})

ipcMain.handle('license:activate', async (_e, token) => {
  if (typeof token !== 'string' || token.length < 40 || token.length > 8192) {
    return { ok: false, error: 'Invalid token. Copy it again from r6coaching.com/#/activate.' }
  }
  const result = await verifyLicense(token.trim())
  if (!result.valid) return { ok: false, error: result.error || 'This license is invalid or no longer active.' }
  try {
    await saveLicense(token.trim())
    return { ok: true, payload: result.payload }
  } catch (err) {
    return { ok: false, error: err.message || 'License could not be stored securely.' }
  }
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
