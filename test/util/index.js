const path = require('path');
const test = require('@playwright/test').test;
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

const stopAppIfStarted = async (thisValue) => {
  if (thisValue.app) {
    await thisValue.app.close();
    thisValue.app = null;
  }
};

module.exports = {
  /**
   * @param {Object} thisValue
   * @param {{
   *  theme?: 'dark' | 'light',
   *  loggedIn?: boolean,
   *  platform?: 'linux' | 'darwin' | 'win32',
   *  browserHistory?: import('node-browser-history').BrowserHistory[],
   *  bookmarks?: { title: string, type: string, web_url: string, parent_url: string, added: number, parent_name: string }[],
   *  favoriteProjects?: { added: number, type: 'projects', web_url: string, id: number, visibility: 'public'|'internal'|'private', name: string, title: string, namespace: { name: string }, parent_name: string, parent_url: string, name_with_namespace: string, open_issues_count: number, last_activity_at: string, avatar_url: string, star_count: number, forks_count: number }[],
   * }
   */
  async newApp(
    thisValue,
    {
      theme,
      loggedIn,
      platform = process.platform,
      browserHistory,
      bookmarks = [],
      favoriteProjects = [],
    } = {},
  ) {
    await stopAppIfStarted(thisValue);

    const store = {
      theme,
      ...userDataIfLoggedIn(loggedIn),
      bookmarks,
      'favorite-projects': favoriteProjects,
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

    return {
      app,
      window,
    };
  },
  stopAppAfterEach() {
    test.afterEach(async function () {
      await stopAppIfStarted(this);
    });
  },
};
