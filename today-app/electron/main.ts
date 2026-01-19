import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/handlers'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Today',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Load the app URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Development: load from Vite dev server
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Production: load from bundled files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Register DevTools shortcut in development mode
  if (is.dev) {
    globalShortcut.register('CommandOrControl+Alt+I', () => {
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools()
      }
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Register IPC handlers before creating window
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    // On macOS, re-create window when dock icon clicked and no windows exist
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS, apps stay active until user quits explicitly with Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts when quitting
  globalShortcut.unregisterAll()
})
