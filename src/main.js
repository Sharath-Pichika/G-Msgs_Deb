const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')

app.setName('Google Messages')

// ---- Privacy hardening ----
app.commandLine.appendSwitch('disable-features', 'MediaRouter,DialMediaRouteProvider')
app.commandLine.appendSwitch('no-referrers-when-downgrade')
app.commandLine.appendSwitch('disable-breakpad')
app.commandLine.appendSwitch('disable-component-update')
app.commandLine.appendSwitch('disable-sync')

let tray = null
let win = null
let lastUnreadCount = 0

// ---- Define the hardening function ----
function hardenSession(ses) {
  const blocked = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'facebook.net', 'facebook.com/tr', 'scorecardresearch.com',
    'quantserve.com', 'hotjar.com', 'clarity.ms', 'criteo.com',
    'adservice.google.com'
  ]

  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const isTracker = blocked.some(t => details.url.includes(t))
    callback({ cancel: isTracker })
  })

  ses.setPermissionRequestHandler((wc, permission, cb) => {
    const allowed = ['notifications', 'media', 'clipboard-sanitized-write']
    cb(allowed.includes(permission))
  })
}

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
      nodeIntegration: false,
      spellcheck: false
    }
  })

  win.webContents.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  )

  win.loadURL('https://messages.google.com/web/conversations')

  // Monitor page for unread count
  win.webContents.on('page-title-updated', (event, title) => {
    if (!title.includes('Google Messages')) return

    const countMatch = title.match(/\((\d+)\)/)
    const currentCount = countMatch ? parseInt(countMatch[1]) : 0

    // Show notification only when count INCREASES (new message arrived)
    if (currentCount > lastUnreadCount && currentCount > 0) {
      const note = new Notification({
        title: 'New Message',
        body: `You have ${currentCount} unread message(s)`,
        icon: path.join(__dirname, 'assets', 'icon.png')
      })
      note.show()
      lastUnreadCount = currentCount
    }

    // Update tray badge
    if (tray) {
      tray.setTitle(currentCount > 0 ? String(currentCount) : '')
    }
  })

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

/*
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
*/

app.whenReady().then(() => {
  // ---- Session privacy isolation ----
  hardenSession(session.defaultSession)

  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (win === null) createWindow()
})
