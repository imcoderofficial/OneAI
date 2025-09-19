const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let storageWatcher = null;

// Set app name and AppUserModelID (Windows) for proper icon and notifications
try {
  app?.setAppUserModelId?.('com.imcoderofficial.oneai');
  if (app) app.name = 'OneAI';
} catch (e) { console.error('Failed to set AppUserModelId:', e); }

function createMenu() {
  // Always include an entry to open the local OneAI index and a default Chatgpt shortcut.
  const chatGptUrl = 'https://chat.openai.com/';
  const template = [
    {
      label: 'OneAI',
      click: () => {
        const file = path.join(__dirname, 'index.html');
        if (mainWindow) mainWindow.loadFile(file).catch(err => console.error('Failed to load file:', err));
      }
    },
    { type: 'separator' },
    {
      label: 'Chatgpt',
      click: () => mainWindow?.loadURL(chatGptUrl).catch(err => console.error('Failed to load Chatgpt URL:', err))
    },
    { type: 'separator' }
  ];

  // Append user-saved entries from storage to the menu.
  try {
    const entries = readEntries();
    if (entries?.length) {
      entries.forEach(e => {
        // ensure label and website exist
        if (!e?.label || !e?.website) return;
        template.push({
          label: e.label,
          click: () => mainWindow?.loadURL(e.website).catch(err => console.error('Failed to open user URL:', err))
        });
      });
    }
  } catch (err) {
    console.error('Error building menu from entries:', err);
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  ,
  // set a window icon where supported
  icon: path.join(__dirname, 'assets', 'logo.ico')
  });

  // Default to an external AI service on startup; user can open OneAI from the menu
  mainWindow.loadURL('https://chat.openai.com/');
  // Prevent in-app navigation for external links and open them in default browser
  try {
    // Links that attempt to open a new window (target="_blank")
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Always open external URLs in the user's default browser
      shell.openExternal(url).catch(err => console.error('Failed to open external URL:', err));
      return { action: 'deny' };
    });

    // Prevent navigation within the app to external origins
    mainWindow.webContents.on('will-navigate', (event, url) => {
      const allowedOrigin = 'https://chat.openai.com/';
      try {
        const target = new URL(url);
        const allowed = new URL(allowedOrigin);
        if (target.origin !== allowed.origin) {
          event.preventDefault();
          shell.openExternal(url).catch(err => console.error('Failed to open external URL:', err));
        }
      } catch (e) {
        console.error('URL parse failed, opening externally:', e);
        // If URL parsing fails, block navigation and open externally as a fallback
        event.preventDefault();
        shell.openExternal(url).catch(err => console.error('Failed to open external URL (fallback):', err));
      }
    });
  } catch (e) {
    console.error('Failed to attach external link handlers:', e);
  }
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  // Start watching the userData folder for changes to the entries file so the menu auto-refreshes
  try {
    const userDataDir = app.getPath('userData');
    storageWatcher = fs.watch(userDataDir, (eventType, filename) => {
      if (!filename) return;
      if (filename === 'oneai_entries.json') {
        // slight debounce to allow writes to finish
        setTimeout(() => {
          try { createMenu(); } catch (e) { console.error('Failed to refresh menu on file change:', e); }
        }, 150);
      }
    });
  } catch (e) {
    console.error('Failed to start storage watcher:', e);
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  try { if (storageWatcher) storageWatcher.close(); } catch (e) { console.error('Failed to close storage watcher:', e); }
});

// --- Simple JSON storage for OneAI entries ---
function storageFilePath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'oneai_entries.json');
}

function readEntries() {
  const file = storageFilePath();
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Failed to read entries:', e);
    return [];
  }
}

function writeEntries(entries) {
  const file = storageFilePath();
  try {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write entries:', e);
    return false;
  }
}

ipcMain.handle('oneai-get-all', () => {
  return readEntries();
});

ipcMain.handle('oneai-create', (event, entry) => {
  const entries = readEntries();
  const id = Date.now().toString();
  const newEntry = { id, ...entry };
  entries.push(newEntry);
  const ok = writeEntries(entries);
  if (ok) {
    try { createMenu(); } catch(e){ console.error('Failed to refresh menu after create:', e); }
    return newEntry;
  }
  return null;
});

ipcMain.handle('oneai-update', (event, updated) => {
  const entries = readEntries();
  const idx = entries.findIndex(e => e.id === updated.id);
  if (idx === -1) return null;
  entries[idx] = updated;
  const ok = writeEntries(entries);
  if (ok) {
    try { createMenu(); } catch(e){ console.error('Failed to refresh menu after update:', e); }
    return updated;
  }
  return null;
});

ipcMain.handle('oneai-delete', (event, id) => {
  let entries = readEntries();
  const before = entries.length;
  entries = entries.filter(e => e.id !== id);
  const ok = writeEntries(entries);
  if (ok) {
    try { createMenu(); } catch(e){ console.error('Failed to refresh menu after delete:', e); }
    return entries.length < before;
  }
  return false;
});

// (Removed delete-all and open-url handlers — UI now uses only CRUD handlers)