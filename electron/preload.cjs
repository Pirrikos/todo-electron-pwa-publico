// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('files', {
  pickAndImport: () => ipcRenderer.invoke('files:pickAndImport'),
  open: (fullPath) => ipcRenderer.invoke('files:open', fullPath),
  remove: (fullPath) => ipcRenderer.invoke('files:remove', fullPath),
});
