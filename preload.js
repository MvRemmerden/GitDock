const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  goToDetail: (value) => ipcRenderer.send('detail-page', value),
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
  isInFocus: (value) => ipcRenderer.send('is-in-focus', value)
}
)

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
