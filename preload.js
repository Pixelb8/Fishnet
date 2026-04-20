const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	send: (channel, data) => ipcRenderer.send(channel, data),
    onChatLine: (callback) => ipcRenderer.on('chat-line', (event, value) => callback(value)),
    openFileDialog: () => ipcRenderer.send('open-file-dialog'),
    onSelectedPath: (callback) => ipcRenderer.on('selected-path', (event, path) => callback(path)),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    onAuthSuccess: (callback) => ipcRenderer.on('auth-success', (event, token) => callback(token)),
	setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
    openExternal: (url) => ipcRenderer.send('open-external', url),
	sound: {
        getSettings: () => ipcRenderer.invoke('get-sound-settings'),
        toggleMute: () => ipcRenderer.invoke('toggle-mute'),
        onMuteToggled: (callback) => ipcRenderer.on('sound-mute-updated', (event, isMuted) => callback(isMuted))
    }
});