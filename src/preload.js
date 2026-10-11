const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe API to the webpage
contextBridge.exposeInMainWorld('messagesAPI', {
  send: (channel, data) => {
    const validChannels = ['notification', 'unread-count']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel, func) => {
    const validChannels = ['notification', 'unread-count']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})
