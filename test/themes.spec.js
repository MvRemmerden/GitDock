const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Themes', function () {
  this.timeout(25000);

  const getBackgroundColor = async (page) => {
    const body = await page.waitForSelector('body');
    return await body.evaluate((button) => getComputedStyle(button).backgroundColor);
  };

  describe('default theme', () => {
    stopAppAfterEach();

    beforeEach(async function () {
      await newApp(this);
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);

      assert.equal(color, 'rgb(9, 12, 16)');
    });
  });

  describe('dark theme', () => {
    stopAppAfterEach();

    beforeEach(async function () {
      await newApp(this, {
        theme: 'dark',
      });
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);

      assert.equal(color, 'rgb(9, 12, 16)');
    });
  });

  describe('light theme', () => {
    stopAppAfterEach();

    beforeEach(async function () {
      await newApp(this, {
        theme: 'light',
      });
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);

      assert.equal(color, 'rgb(255, 255, 255)');
    });
  });
});
