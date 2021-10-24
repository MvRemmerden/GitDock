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

  const supportedBrowsersText = async (app) => {
    const element = await app.client.$('.supported-browsers');
    return element.getText();
  };

  const historyTexts = async (app) => {
    const elements = await app.client.$$('.history-entry');
    const texts = await Promise.all(elements.map((element) => element.getText()));
    return texts;
  };

  SUPPORTED_PLATFORMS.forEach(function ({ platform, emptyMessage }) {
    describe(`${platform} platform`, function () {
      describe('without history', function () {
        stopAppAfterEach();
        this.beforeEach(async function () {
          this.app = newApp({ platform, loggedIn: true });
          await this.app.start();
        });

        it('renders the correct message', async function () {
          const actual = await supportedBrowsersText(this.app);
          assert.equal(actual, emptyMessage);
        });
      });

      describe('with history', function () {
        stopAppAfterEach();
        this.beforeEach(async function () {
          this.app = newApp({
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
          await this.app.start();
        });

        it('renders the history', async function () {
          const actual = await historyTexts(this.app);

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
        this.app = newApp({ platform, loggedIn: true });
        await this.app.start();
      });

      it('renders the correct message', async function () {
        const actual = await supportedBrowsersText(this.app);
        assert.equal(actual, emptyMessage);
      });
    });

    describe('with history', function () {
      stopAppAfterEach();
      this.beforeEach(async function () {
        this.app = newApp({
          platform,
          loggedIn: true,
          browserHistory: [
            { title: 'Test Issue #1', url: 'https://gitlab.com/user/project/-/issues/1' },
          ],
        });
        await this.app.start();
      });

      it('renders the info message as if there was no history', async function () {
        const actual = await supportedBrowsersText(this.app);
        assert.equal(actual, emptyMessage);
      });
    });
  });
});
