module.exports = {
  async getAllHistory(historyTimeLength) {
    if (!this.isSupported()) {
      return Promise.resolve([]);
    }
    return require('node-browser-history').getAllHistory(historyTimeLength);
  },
  isSupported() {
    const supportedPlattforms = ['win32', 'darwin'];

    return supportedPlattforms.includes(process.platform);
  }
};
