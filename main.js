const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const { net } = require('electron'); // Use Electron's native net module
let mainWindow;
let watcher = null;
const mainDebug = true; 
const GITHUB_OWNER = "Pixelb8";
const GITHUB_REPO = "Fishnet";
const APP_USER_AGENT = "PIXELB8-Fish-Net";
function checkForUpdates() {
    const currentVersion = app.getVersion();

    const options = {
        hostname: "api.github.com",
        path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        headers: {
            "User-Agent": APP_USER_AGENT
        }
    };

    https.get(options, res => {
        let data = "";

        res.on("data", chunk => data += chunk);
        res.on("end", () => {
            try {
                const release = JSON.parse(data);
                if (!release.tag_name) return;

                const latestVersion = release.tag_name.replace(/^v/, "");

                // Logic check: returns null if not newer, otherwise returns type
                const updateType = getUpdateType(latestVersion, currentVersion);
                if (!updateType) return; 

                const exeAsset = release.assets?.find(a =>
                    a.name.toLowerCase().endsWith(".exe")
                );

                dialog.showMessageBox({
                    type: "info",
                    title: "Update Available",
                    message:
                        `A new ${updateType.toUpperCase()} update is available for Fish_Net.\n\n` +
                        `Current: ${currentVersion}\n` +
                        `Latest: ${latestVersion}`,
                    buttons: ["Download", "Later", "View Release Notes"],
                    defaultId: 0,
                    cancelId: 1
                }).then(result => {
                    // Download & Run Installer
                    if (result.response === 0) {
                        if (exeAsset?.browser_download_url) {
                            shell.openExternal(exeAsset.browser_download_url);
                        } else {
                            shell.openExternal(release.html_url);
                        }
                    }

                    // View Release Notes
                    if (result.response === 2) {
                        shell.openExternal(release.html_url);
                    }
                });

            } catch (err) {
                console.error("Update check parse error:", err);
            }
        });
    }).on("error", err => {
        console.error("Update check failed:", err);
    });
}

// Support functions for version math
function getUpdateType(latest, current) {
    const l = latest.split(".").map(Number);
    const c = current.split(".").map(Number);

    if (l[0] > c[0]) return "major";
    if (l[0] < c[0]) return null;

    if (l[1] > c[1]) return "minor";
    if (l[1] < c[1]) return null;

    if (l[2] > c[2]) return "patch";

    return null;
}
// ==========================================
// 1. SET UP THE SINGLE INSTANCE LOCK
// ==========================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Another instance is running; quit this one so the link sends to the primary app
    app.quit();
} else {
    // ==========================================
    // 1.1 LISTEN FOR SECOND INSTANCE (The Handshake Receiver)
    // ==========================================
    app.on('second-instance', (event, commandLine) => {
        if (mainDebug) console.log("📥 Redirect detected from browser...");
        
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Find the pixelb8:// link specifically within the command line arguments
            const url = commandLine.find(arg => arg.startsWith('pixelb8://'));
            if (url) {
                if (mainDebug) console.log("🌉 Found token in redirect! Sending to UI...");
                handleDeepLink(url);
            }
        }
    });

    // ==========================================
    // 1.2 STANDARD LIFECYCLE
    // ==========================================
    app.whenReady().then(() => {
        // --- 4. REGISTER PROTOCOL ---
        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('pixelb8', process.execPath, [path.resolve(process.argv[1])]);
            }
        } else {
            app.setAsDefaultProtocolClient('pixelb8');
        }

        createWindow();
		setTimeout(() => {
            checkForUpdates();
        }, 3000);
        // --- 5. COLD START CHECK ---
        // Handles cases where the app was NOT running and was opened by the link
        const url = process.argv.find(arg => arg.startsWith('pixelb8://'));
        if (url && mainWindow) {
            mainWindow.webContents.once('did-finish-load', () => {
                if (mainDebug) console.log("⏳ Cold start detected. Initializing dispatcher...");
                // Note: If you add a splash screen later, increase this timeout
                setTimeout(() => {
                    handleDeepLink(url);
                }, 2000); 
            });
        }
    });
}

// ==========================================
// 2. WINDOW INITIALIZATION
// ==========================================

let tray = null; // Prevent garbage collection

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 650,
		icon: path.join(__dirname, 'assets/fishnetimage.png'),
        frame: false, // <--- REMOVES TITLE BAR & BORDERS
        transparent: true, // Optional: if you want rounded corners or glow
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
			autoplayPolicy: 'no-user-gesture-required',
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        }
    });

    // 1. SYSTEM TRAY INITIALIZATION
    const iconPath = path.join(__dirname, 'assets/fishnet.png'); // Ensure you have an icon.png
    tray = new Tray(iconPath);
    
    const trayMenu = Menu.buildFromTemplate([
		{ label: 'PIXELB8 OMEGA', enabled: false },
		{ type: 'separator' },
		{ 
			label: 'Reload App', 
			click: () => {
				if (mainWindow) {
					mainWindow.webContents.reload();
					// Optional: Bring to front on reload
					if (mainWindow.isMinimized()) mainWindow.restore();
					mainWindow.focus();
				}
			} 
		},
		{ label: 'Show App', click: () => mainWindow.show() },
		{ label: 'Hide to Tray', click: () => mainWindow.hide() },
		{ type: 'separator' },
		{ label: 'Exit Completely', click: () => app.quit() }
	]);

    tray.setToolTip('PIXELB8 Fishing Scout');
    tray.setContextMenu(trayMenu);

    // Double click tray icon to show app
    tray.on('double-click', () => mainWindow.show());
    mainWindow.loadFile('index.html');
    // 2. CSP HEADERS (Keep your existing logic)
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [
					"default-src 'self'; " +
					"frame-src 'self' https://pixelb8lol.firebaseapp.com https://pixelb8lol.web.app; " +
					"script-src 'self' https://www.gstatic.com https://apis.google.com; " +
					// ADDED https://www.gstatic.com to connect-src below
					"connect-src 'self' https://api.entropianexus.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com https://www.gstatic.com https:; " +
					"style-src 'self' 'unsafe-inline'; " +
					"img-src 'self' data: https:;"
				]
			}
        });
    });


}
// ==========================================
// 3. THE DISPATCHER
// ==========================================
function handleDeepLink(url) {
    try {
        if (url && url.includes('pixelb8://')) {
            const cleanUrl = url.replace(/"/g, ''); 
            const urlObj = new URL(cleanUrl);
            const token = urlObj.searchParams.get('token');

            if (token && mainWindow) {
                if (mainDebug) console.log("🌉 MAIN: Dispatching token to Bridge...");

                // Visual debug inject
                mainWindow.webContents.executeJavaScript(`console.warn("📢 MAIN PROCESS: Passing token to UI Bridge.")`);

                // Send to fishing-auth.js
                mainWindow.webContents.send('auth-success', token);
            }
        }
    } catch (e) {
        console.error("Failed to parse deep link:", e);
    }
}


// --- Inside main.js ---

// Define the absolute paths using app.getAppPath() 
// This ensures they work whether you are in dev or a compiled .exe
const globalSoundSettings = {
    isMuted: false,
    soundMap: {
        'gotmailsound': path.join(app.getAppPath(), 'assets', 'sounds', 'mail_in.mp3'),
        'sendmailsound': path.join(app.getAppPath(), 'assets', 'sounds', 'mail_out.mp3'),
        'startup': path.join(app.getAppPath(), 'assets', 'sounds', 'SplashSound.mp3'),
        'ui-click': path.join(app.getAppPath(), 'assets', 'sounds', 'tabclick.mp3')
    }
};

// Allow the UI to "Check in" and get the valid paths
ipcMain.handle('get-sound-settings', () => {
    return globalSoundSettings;
});

ipcMain.handle('toggle-mute', async () => {
    globalSoundSettings.isMuted = !globalSoundSettings.isMuted;
    // Broadcast to the window
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sound-mute-updated', globalSoundSettings.isMuted);
    }
    return globalSoundSettings.isMuted;
});



ipcMain.on('set-always-on-top', (event, value) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(value, 'screen-saver'); 
        // 'screen-saver' ensures it stays above almost everything, including taskbars
        if (mainDebug) console.log(`📌 Always on top: ${value}`);
    }
});

// macOS Protocol Handler
app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
});

// ==========================================
// 4. IPC BRIDGE LISTENERS
// ==========================================

ipcMain.on('open-file-dialog', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: 'Select Entropia Chat.log',
        filters: [{ name: 'chat', extensions: ['log'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        event.reply('selected-path', result.filePaths[0]);
    }
});

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

ipcMain.on('close-app', () => {
    app.quit();
});

// Native Chat Log Watcher
ipcMain.on('start-watch', (event, filePath) => {
    if (watcher) {
        watcher.close();
        if (mainDebug) console.log("Watcher reset.");
    }

    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }

    // Set initial size to the current size to avoid reading the whole file on start
    let fileSize = fs.statSync(filePath).size;

    watcher = fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const stats = fs.statSync(filePath);
                const newSize = stats.size;

                if (newSize > fileSize) {
                    const stream = fs.createReadStream(filePath, { 
                        start: fileSize, 
                        end: newSize,
                        encoding: 'utf8' 
                    });

                    stream.on('data', (chunk) => {
                        const lines = chunk.split(/\r?\n/);
                        lines.forEach(line => {
                            if (line.trim() && mainWindow) {
                                // Standardized communication to the UI
                                mainWindow.webContents.send('chat-line', line);
                            }
                        });
                    });
                    fileSize = newSize;
                }
            } catch (err) {
                console.error("Watch Error:", err);
            }
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});