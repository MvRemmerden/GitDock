const supportedPlattforms = ['win32', 'darwin', 'linux'];
const processInfo = require('./process-info');

module.exports = {
  async getAllHistory() {
    if (!this.isSupported()) {
      return Promise.resolve([]);
    }
    // eslint-disable-next-line global-require
    return require('node-browser-history').getAllHistory(14320);
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
