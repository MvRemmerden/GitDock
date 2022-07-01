const expect = require('@playwright/test').expect;
const test = require('@playwright/test').test;
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
      expect(color).toEqual('rgb(255, 255, 255)');
    });
  });
});
