const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	send: (channel, data) => ipcRenderer.send(channel, data),
    onChatLine: (callback) => ipcRenderer.on('chat-line', (event, value) => callback(value)),
    openFileDialog: () => ipcRenderer.send('open-file-dialog'),
    onSelectedPath: (callback) => ipcRenderer.on('selected-path', (event, path) => callback(path)),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    onAuthSuccess: (callback) => ipcRenderer.on('auth-success', (event, token) => callback(token)),
    openExternal: (url) => ipcRenderer.send('open-external', url)
});