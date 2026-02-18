const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const express = require('express');
const ip = require('ip');
const fs = require('fs');
const os = require('os');
const net = require('net');

// SETUP LOGGING
const logPath = path.join(os.homedir(), 'Desktop', 'impresora_debug.txt');
function log(msg) {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
}

log('Starting application...');

let mainWindow;
let server;

function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            server.close(() => resolve(startPort));
        });
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
    });
}

async function startServer() {
    try {
        const appExpress = express();
        // Verify valid static path
        const staticPath = path.join(__dirname, '../dist');
        log(`Static path: ${staticPath}`);

        if (!fs.existsSync(staticPath)) {
            log('ERROR: dist folder not found!');
            dialog.showErrorBox('Error', 'Dist folder not found at: ' + staticPath);
        }

        appExpress.use(express.static(staticPath));

        // Fallback to index.html for SPA (handled as final middleware)
        appExpress.use((req, res) => {
            res.sendFile(path.join(staticPath, 'index.html'));
        });

        const port = await findAvailablePort(3000);
        const localIp = ip.address();

        return new Promise((resolve) => {
            server = appExpress.listen(port, '0.0.0.0', () => {
                log(`Server running at http://${localIp}:${port}`);
                resolve({ ip: localIp, port });
            });
        });
    } catch (e) {
        log(`Server Error: ${e.message}`);
        dialog.showErrorBox('Server Error', e.message);
        throw e;
    }
}

async function createWindow() {
    try {
        log('Creating window...');
        // Start local server first
        const { ip, port } = await startServer();

        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            // icon: path.join(__dirname, '../public/vite.svg'), 
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
            autoHideMenuBar: true,
        });

        const url = `http://${ip}:${port}`;
        log(`Loading URL: ${url}`);
        mainWindow.loadURL(url);

        mainWindow.on('closed', () => {
            log('Window closed');
            mainWindow = null;
        });

        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    } catch (e) {
        log(`Window Creation Error: ${e.message}`);
        dialog.showErrorBox('Error', e.message);
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    log('All windows closed. Quitting.');
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
