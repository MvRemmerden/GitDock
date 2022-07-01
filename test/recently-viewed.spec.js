const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('"Recently viewed" section', function () {
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

  const supportedBrowsersText = async (page) => page.innerText('.supported-browsers');

  const historyTexts = async (page) => {
    const elements = await page.locator('.history-entry');
    return elements.allInnerTexts();
  };

  SUPPORTED_PLATFORMS.forEach(({ platform, emptyMessage }) => {
    test.describe(`${platform} platform`, () => {
      test.describe('without history', function () {
        stopAppAfterEach();
        test.beforeEach(async function () {
          await newApp(this, {
            platform,
            loggedIn: true,
          });
        });

        test('renders the correct message', async function () {
          const actual = await supportedBrowsersText(this.window);
          expect(actual).toEqual(emptyMessage);
        });
      });

      test.describe('with history', function () {
        stopAppAfterEach();
        test.beforeEach(async function () {
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

        test('renders the history', async function () {
          const actual = await historyTexts(this.window);

          expect(actual.length).toEqual(1);
          expect(actual[0]).toContain('Test Issue (#1)');
          expect(actual[0]).toContain('ago · user / project');
        });
      });
    });
  });

  test.describe('unsupported platform', () => {
    const platform = 'android';
    const emptyMessage = 'No browsers are supported on your operating system yet.';

    test.describe('without history', function () {
      stopAppAfterEach();
      test.beforeEach(async function () {
        await newApp(this, {
          platform,
          loggedIn: true,
        });
      });

      test('renders the correct message', async function () {
        const actual = await supportedBrowsersText(this.window);
        expect(actual).toEqual(emptyMessage);
      });
    });

    test.describe('with history', function () {
      stopAppAfterEach();
      test.beforeEach(async function () {
        await newApp(this, {
          platform,
          loggedIn: true,
          browserHistory: [
            {
              title: 'Test Issue #1',
              url: 'https://gitlab.com/user/project/-/issues/1',
            },
          ],
        });
      });

      test('renders the info message as if there was no history', async function () {
        const actual = await supportedBrowsersText(this.window);
        expect(actual).toEqual(emptyMessage);
      });
    });
  });
});
