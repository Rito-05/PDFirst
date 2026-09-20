// electron/preload.cjs - Minimal Electron Preload Script for PDFirst Desktop App
const { contextBridge } = require('electron');

// Expose safe, minimal platform metadata to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
