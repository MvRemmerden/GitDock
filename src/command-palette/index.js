const { globalShortcut, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { store } = require('../../lib/store');
const BrowserHistory = require('../../lib/browser-history');
const gitdock = require('../../lib/gitlab');

const HTML_PATH = path.join(__dirname, 'bar.html');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
let cpWindow;

async function getRecentlyVisited() {
  const recentlyVisitedArray = [];
  await BrowserHistory.getAllHistory().then(async (history) => {
    const item = Array.prototype.concat.apply([], history);
    item.sort((a, b) => {
      if (a.utc_time > b.utc_time) {
        return -1;
      }
      if (b.utc_time > a.utc_time) {
        return 1;
      }
      return -1;
    });
    let i = 0;
    for (let j = 0; j < item.length; j += 1) {
      const { title } = item[j];
      let { url } = item[j];
      const isHostUrl = url.startsWith(`${store.host}/`);
      const isIssuable =
        url.includes('/-/issues/') ||
        url.includes('/-/merge_requests/') ||
        url.includes('/-/epics/');
      const displayedTitle = (title || '').split(' · ')[0].split(' (')[0];
      const wasNotProcessed = !recentlyVisitedArray.some(
        (arrayItem) => arrayItem.title === displayedTitle,
      );
      const ignoredTitlePrefixes = [
        'Not Found ',
        'New Issue ',
        'New Merge Request ',
        'New merge request ',
        'New Epic ',
        'Edit ',
        'Merge requests ',
        'Issues ',
        '500 Error - GitLab',
        'Checking your Browser - GitLab',
      ];
      const titlePrefix = (title || '').split('·')[0];
      if (
        title &&
        isHostUrl &&
        isIssuable &&
        wasNotProcessed &&
        !ignoredTitlePrefixes.includes(titlePrefix)
      ) {
        const nameWithNamespace = item[j].url.replace(`${store.host}/`, '').split('/-/')[0];
        if (nameWithNamespace.split('/')[0] !== 'groups') {
          url = `${store.host}/api/v4/projects/${nameWithNamespace.split('/')[0]}%2F${
            nameWithNamespace.split('/')[1]
          }?access_token=${store.access_token}`;
        } else {
          url = `${store.host}/api/v4/groups/${nameWithNamespace.split('/')[0]}?access_token=${
            store.access_token
          }`;
        }
        // eslint-disable-next-line no-await-in-loop
        await gitdock.fetchUrlInfo(item[j].url).then((result) => {
          item[j].type = result.type;
        });
        [item[j].title] = item[j].title.split(' · ');
        [item[j].title] = item[j].title.split(' (');
        recentlyVisitedArray.push(item[j]);
        i += 1;
        if (i === 5) {
          break;
        }
      }
    }
    store['recently-visited'] = recentlyVisitedArray;
  });
}
setInterval(() => {
  getRecentlyVisited();
}, 15000);
getRecentlyVisited();

module.exports = class CommandPalette {
  constructor() {
    cpWindow = this.newWindow();
    cpWindow.on('blur', () => {
      cpWindow.hide();
    });
  }

  async register({ shortcut }) {
    this.unregister();

    globalShortcut.registerAll(shortcut, async () => this.open());

    ipcMain.on('open-gitlab', (_, arg) => {
      if (arg.indexOf(store.host) !== -1) {
        shell.openExternal(`${arg}`);
      } else {
        shell.openExternal(`${store.host}${arg}`);
      }
    });
    ipcMain.on('hide-command-palette', () => {
      cpWindow.hide();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async unregister() {
    globalShortcut.unregisterAll();

    ipcMain.removeAllListeners('open-gitlab');
    ipcMain.removeAllListeners('hide-command-palette');
  }

  // eslint-disable-next-line class-methods-use-this
  async open() {
    cpWindow.show();
    // cpWindow.openDevTools();
  }

  newWindow(show = false) {
    if (this.window && !this.window.isDestroyed()) {
      if (show) {
        this.window.show();
      }
      return this.window;
    }

    const window = new BrowserWindow({
      height: 475,
      width: 620,
      center: true,
      alwaysOnTop: true,
      frame: false,
      show: false,
      resizable: false,
      webPreferences: {
        preload: PRELOAD_PATH,
      },
      title: 'GitDock Command Palette',
    });
    if (show) {
      window.once('ready-to-show', () => {
        window.show();
      });
    }
    window.loadFile(HTML_PATH);
    return window;
  }
};
