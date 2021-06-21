const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron',{
    goToDetail: (value) => ipcRenderer.send('detail-page', value),
    goToOverview: () => ipcRenderer.send('go-to-overview'),
    switchIssues: (value) => ipcRenderer.send('switch-issues', value),
    switchMRs: (value) => ipcRenderer.send('switch-mrs', value),
    switchPage: (value) => ipcRenderer.send('switch-page', value),
    searchRecent: (value) => ipcRenderer.send('search-recent', value),
    nextCommit: () => ipcRenderer.send('next-commit')
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
