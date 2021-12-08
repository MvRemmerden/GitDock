const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Themes', function () {
  this.timeout(25000);

  const getBackgroundColor = async (page) =>
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--background-color'),
    );

  describe('dark theme', function () {
    stopAppAfterEach();

    beforeEach(async function () {
      await newApp(this, { theme: 'dark' });
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);

      assert.equal(color, '#090c10');
    });
  });

  describe('light theme', function () {
    stopAppAfterEach();

    beforeEach(async function () {
      await newApp(this, { theme: 'light' });
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.window);

      assert.equal(color, '#fff');
    });
  });
});
