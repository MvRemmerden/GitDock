const { globalShortcut, BrowserWindow, ipcMain, shell } = require('electron');
const { store } = require('../../lib/store');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'bar.html');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
let cpWindow;

module.exports = class QuickActions {
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
    ipcMain.on('hide-quick-actions', () => {
      cpWindow.hide();
    });
  }

  async unregister() {
    globalShortcut.unregisterAll();

    ipcMain.removeAllListeners('open-gitlab');
    ipcMain.removeAllListeners('hide-quick-actions');
  }

  async open() {
    cpWindow.show();
    //cpWindow.openDevTools();
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
      title: 'GitDock Quick Actions',
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
