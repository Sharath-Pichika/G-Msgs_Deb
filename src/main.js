const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')

app.setName('Google Messages')

let tray = null
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    title: 'Google Messages',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  win.loadURL('https://messages.google.com/web/conversations')

  // Monitor page for unread count
  win.webContents.on('page-title-updated', (event, title) => {
    if (title.includes('Google Messages') && !title.includes('Web')) {
      const countMatch = title.match(/\((\d+)\)/);
      if (countMatch) {
        const count = parseInt(countMatch[1]);
                if (tray) {
           tray.setTitle(count > 0 ? String(count) : '')
        }
      }
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('closed', () => { win = null })
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png')
  
  // Fallback to a default icon if none exists
  if (!fs.existsSync(iconPath)) {
    tray = new Tray('/usr/share/icons/hicolor/48x48/apps/user-icon.png')
  } else {
    tray = new Tray(iconPath)
  }

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => { if (win) win.show() }
    },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])

  tray.setToolTip('Google Messages')
  tray.setContextMenu(trayMenu)

  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) win.hide()
      else win.show()
    }
  })
}

// Keep ipcMain listeners for future features
// Handle notifications from the web page
ipcMain.on('notification', (event, data) => {
  const note = new Notification({
    title: data.title,
    body: data.body,
    icon: data.icon
  })
  note.on('click', () => { if (win) win.show() })
  note.show()
})

// Handle unread count updates
ipcMain.on('unread-count', (event, count) => {
  if (tray) {
    tray.setTitle(count > 0 ? String(count) : '')
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (win === null) createWindow()
})
