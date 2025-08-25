// electron/main.cjs
// Ventana principal y lógica de archivos (copiar/abrir/borrar) vía IPC.

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
let mainWindow;

// --- utilidades ---
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function attachmentsDir() {
  // Carpeta privada por usuario, persiste entre versiones
  return path.join(app.getPath('userData'), 'attachments');
}

// --- ventana ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 760,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// --- IPC: gestionar archivos ---
ipcMain.handle('files:pickAndImport', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  if (res.canceled || !res.filePaths?.length) return [];

  const dir = attachmentsDir();
  ensureDir(dir);

  const saved = [];
  for (const src of res.filePaths) {
    const base = path.basename(src);
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const dest = path.join(dir, `${unique}__${base}`);
    fs.copyFileSync(src, dest);
    const stat = fs.statSync(dest);
    saved.push({
      id: unique,
      name: base,
      size: stat.size,
      path: dest, // ruta completa en el almacén de la app
    });
  }
  return saved;
});

ipcMain.handle('files:open', async (_e, fullPath) => {
  if (!fullPath) return;
  return shell.openPath(fullPath);
});

ipcMain.handle('files:remove', async (_e, fullPath) => {
  try {
    if (fullPath && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    return true;
  } catch {
    return false;
  }
});

// --- ciclo de vida ---
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

