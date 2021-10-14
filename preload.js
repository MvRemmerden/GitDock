const { contextBridge, ipcRenderer } = require('electron');

const api = {
  goToDetail: (value) => ipcRenderer.send('detail-page', value),
  goToSubDetail: (value) => ipcRenderer.send('sub-detail-page', value),
  goBackToDetail: () => ipcRenderer.send('back-to-detail-page'),
  goToOverview: () => ipcRenderer.send('go-to-overview'),
  switchIssues: (value) => ipcRenderer.send('switch-issues', value),
  switchMRs: (value) => ipcRenderer.send('switch-mrs', value),
  switchPage: (value) => ipcRenderer.send('switch-page', value),
  searchRecent: (value) => ipcRenderer.send('search-recent', value),
  changeCommit: (value) => ipcRenderer.send('change-commit', value),
  changeProjectCommit: (value) => ipcRenderer.send('change-project-commit', value),
  addBookmark: (value) => ipcRenderer.send('add-bookmark', value),
  addProject: (value) => ipcRenderer.send('add-project', value),
  startBookmarkDialog: () => ipcRenderer.send('start-bookmark-dialog'),
  startProjectDialog: () => ipcRenderer.send('start-project-dialog'),
  deleteBookmark: (value) => ipcRenderer.send('delete-bookmark', value),
  deleteProject: (value) => ipcRenderer.send('delete-project', value),
  changeTheme: (value) => ipcRenderer.send('change-theme', value),
  changeAnalytics: (value) => ipcRenderer.send('change-analytics', value),
  startLogin: () => ipcRenderer.send('start-login'),
  startManualLogin: (value) => ipcRenderer.send('start-manual-login', value),
  logout: () => ipcRenderer.send('logout'),
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', api);
} else {
  function deepFreeze(o) {
    Object.freeze(o);

    Object.getOwnPropertyNames(o).forEach((prop) => {
      if (
        o.hasOwnProperty(prop) &&
        o[prop] !== null &&
        (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
        !Object.isFrozen(o[prop])
      ) {
        deepFreeze(o[prop]);
      }
    });
    return o;
  }
  deepFreeze(api);
  // @ts-expect-error https://github.com/electron-userland/spectron#node-integration
  window.electronRequire = require;
  // @ts-expect-error https://github.com/electron-userland/spectron/issues/693#issuecomment-747872160
  window.electron = api;
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
