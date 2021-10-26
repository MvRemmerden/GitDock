const electronPath = require('electron');
const path = require('path');
const Application = require('spectron').Application;

const userDataIfLoggedIn = (loggedIn = false) => {
  if (!loggedIn) {
    return {};
  }
  return {
    access_token: process.env.ACCESS_TOKEN,
    user_id: 'mvanremmerden',
    username: 'Marcel van Remmerden',
  };
};

module.exports = {
  /**
   * @param {{
   *  theme?: 'dark' | 'light',
   *  loggedIn?: boolean,
   *  platform?: 'linux' | 'darwin' | 'win32',
   *  browserHistory?: import('node-browser-history').BrowserHistory[],
   *  bookmarks?: { title: string, type: string, web_url: string, parent_url: string, added: number, parent_name: string }[] },
   * }
   */
  newApp({ theme, loggedIn, platform = process.platform, browserHistory, bookmarks = [] } = {}) {
    const store = {
      theme,
      ...userDataIfLoggedIn(loggedIn),
      bookmarks,
    };

    const app = new Application({
      path: electronPath,
      args: [
        '-r',
        `${__dirname}/mocks.js`,
        '--no-sandbox',
        '--ignore-certificate-error',
        '--disable-dev-shm-usage',
        '--whitelisted-ips=',
        path.join(__dirname, '..', '..'),
      ],
      env: {
        NODE_ENV: 'test',
        MOCK_STORE: typeof store === 'object' ? JSON.stringify(store) : '',
        MOCK_PLATFORM: platform,
        MOCK_BROWSER_HISTORY: JSON.stringify(browserHistory || []),
        LOGGED_IN: loggedIn ? 'true' : '',
      },
    });
    return app;
  },
  stopAppAfterEach() {
    afterEach(async function () {
      if (this.app && this.app.isRunning()) {
        await this.app.stop();
      }
    });
  },
};
