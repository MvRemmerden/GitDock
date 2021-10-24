const supportedPlattforms = ['win32', 'darwin', 'linux'];
const processInfo = require('./process-info');

module.exports = {
  async getAllHistory(historyTimeLength) {
    if (!this.isSupported()) {
      return Promise.resolve([]);
    }
    return require('node-browser-history').getAllHistory(historyTimeLength);
  },
  isSupported() {
    return supportedPlattforms.includes(processInfo.platform);
  },
  supportedBrowserNames() {
    switch (processInfo.platform) {
      case 'linux':
        return 'Chrome and Firefox';
      case 'win32':
        return 'Chrome, Edge, Firefox, Opera, and Brave';
      case 'darwin':
        return 'Chrome, Edge, Firefox, Opera, Vivaldi, and Brave';
      default:
        return '';
    }
  },
};
