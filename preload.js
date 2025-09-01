// Preload script. Use this to expose a safe API to renderer if needed.
window.addEventListener('DOMContentLoaded', () => {
  // placeholder
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oneai', {
  getAll: () => ipcRenderer.invoke('oneai-get-all'),
  create: (entry) => ipcRenderer.invoke('oneai-create', entry),
  update: (entry) => ipcRenderer.invoke('oneai-update', entry),
  delete: (id) => ipcRenderer.invoke('oneai-delete', id)
});
