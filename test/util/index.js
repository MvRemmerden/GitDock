const path = require('path');
const { _electron: electron } = require('playwright-core');

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
  async newApp(
    thisValue,
    { theme, loggedIn, platform = process.platform, browserHistory, bookmarks = [] } = {},
  ) {
    const store = {
      theme,
      ...userDataIfLoggedIn(loggedIn),
      bookmarks,
    };

    const app = await electron.launch({
      args: ['-r', `${__dirname}/mocks.js`, path.join(__dirname, '..', '..', 'myApp.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MOCK_STORE: typeof store === 'object' ? JSON.stringify(store) : '',
        MOCK_PLATFORM: platform,
        MOCK_BROWSER_HISTORY: JSON.stringify(browserHistory || []),
        LOGGED_IN: loggedIn ? 'true' : '',
      },
    });
    const window = await app.firstWindow();
    await window.waitForSelector('[data-testid="gitdock"]');
    window.setDefaultTimeout(5000);

    if (thisValue) {
      thisValue.app = app;
      thisValue.window = window;
    }

    return { app, window };
  },
  stopAppAfterEach() {
    afterEach(async function () {
      if (this.app) {
        await this.app.close();
        this.app = null;
      }
    });
  },
};
