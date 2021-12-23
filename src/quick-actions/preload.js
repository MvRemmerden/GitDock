const { contextBridge, ipcRenderer } = require('electron');
const { store } = require('../../lib/store');

const api = {
  openGitLab: (url) => ipcRenderer.send('open-gitlab', url),
  hideQuickActions: () => ipcRenderer.send('hide-quick-actions'),
  getUsername: () => store.username,
  getFavorites: () => store['favorite-projects'],
  getBookmarks: () => store['bookmarks'],
  getRecents: () => store['recently-visited'],
  getTheme: () => store.theme,
};

contextBridge.exposeInMainWorld('gitdock', api);
