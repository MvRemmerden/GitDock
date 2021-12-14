const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('"Recently viewed" section', function () {
  this.timeout(25000);

  const SUPPORTED_PLATFORMS = [
    {
      platform: 'linux',
      emptyMessage: 'Supported browsers: Chrome and Firefox.',
    },
    {
      platform: 'win32',
      emptyMessage: 'Supported browsers: Chrome, Edge, Firefox, Opera, and Brave.',
    },
    {
      platform: 'darwin',
      emptyMessage: 'Supported browsers: Chrome, Edge, Firefox, Opera, Vivaldi, and Brave.',
    },
  ];

  const supportedBrowsersText = async (page) => {
    return page.innerText('.supported-browsers');
  };

  const historyTexts = async (page) => {
    const elements = await page.locator('.history-entry');
    return elements.allInnerTexts();
  };

  SUPPORTED_PLATFORMS.forEach(function ({ platform, emptyMessage }) {
    describe(`${platform} platform`, function () {
      describe('without history', function () {
        stopAppAfterEach();
        this.beforeEach(async function () {
          await newApp(this, { platform, loggedIn: true });
        });

        it('renders the correct message', async function () {
          const actual = await supportedBrowsersText(this.window);
          assert.equal(actual, emptyMessage);
        });
      });

      describe('with history', function () {
        stopAppAfterEach();
        this.beforeEach(async function () {
          await newApp(this, {
            platform,
            loggedIn: true,
            browserHistory: [
              [
                {
                  title: 'Test Issue (#1) · Issues · user / project · GitLab',
                  url: 'https://gitlab.com/user/project/-/issues/1',
                  browser: 'Chrome',
                  utc_time: '2021-10-13 16:42:17',
                },
              ],
            ],
          });
        });

        it('renders the history', async function () {
          const actual = await historyTexts(this.window);

          assert.equal(actual.length, 1);
          assert.equal(actual[0].includes('Test Issue (#1)'), 1);
          assert.equal(actual[0].includes('ago · user / project'), 1);
        });
      });
    });
  });

  describe('unsupported platform', function () {
    const platform = 'android';
    const emptyMessage = 'No browsers are supported on your operating system yet.';

    describe('without history', function () {
      stopAppAfterEach();
      this.beforeEach(async function () {
        await newApp(this, { platform, loggedIn: true });
      });

      it('renders the correct message', async function () {
        const actual = await supportedBrowsersText(this.window);
        assert.equal(actual, emptyMessage);
      });
    });

    describe('with history', function () {
      stopAppAfterEach();
      this.beforeEach(async function () {
        await newApp(this, {
          platform,
          loggedIn: true,
          browserHistory: [
            { title: 'Test Issue #1', url: 'https://gitlab.com/user/project/-/issues/1' },
          ],
        });
      });

      it('renders the info message as if there was no history', async function () {
        const actual = await supportedBrowsersText(this.window);
        assert.equal(actual, emptyMessage);
      });
    });
  });
});
