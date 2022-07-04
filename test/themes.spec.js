const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Themes', function () {
  const getBackgroundColor = async (page) => {
    const body = await page.waitForSelector('body');
    return await body.evaluate((button) => getComputedStyle(button).backgroundColor);
  };

  test.describe('default theme', () => {
    stopAppAfterEach();

    test.beforeEach(async function () {
      await newApp(this);
    });

    test('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);
      await this.window.screenshot({path: 'test-results/screenshots/themes/has-the-correct-background-color-1.png', fullPage: true});
      expect(color).toEqual('rgb(9, 12, 16)');
    });
  });

  test.describe('dark theme', () => {
    stopAppAfterEach();

    test.beforeEach(async function () {
      await newApp(this, {
        theme: 'dark',
      });
    });

    test('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);
      await this.window.screenshot({path: 'test-results/screenshots/themes/has-the-correct-background-color-2.png', fullPage: true});
      expect(color).toEqual('rgb(9, 12, 16)');
    });
  });

  test.describe('light theme', () => {
    stopAppAfterEach();

    test.beforeEach(async function () {
      await newApp(this, {
        theme: 'light',
      });
    });

    test('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);
      await this.window.screenshot({path: 'test-results/screenshots/themes/has-the-correct-background-color-3.png', fullPage: true});
      expect(color).toEqual('rgb(255, 255, 255)');
    });
  });
});
