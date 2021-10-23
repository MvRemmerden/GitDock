const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Themes', function () {
  this.timeout(25000);

  const getBackgroundColor = async (app) =>
    app.webContents.executeJavaScript(
      'document.documentElement.style.getPropertyValue("--background-color")',
    );

  describe('dark theme', function () {
    stopAppAfterEach();

    beforeEach(async function () {
      this.app = newApp({ theme: 'dark' });
      await this.app.start();
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.app);

      assert.equal(color, '#090c10');
    });
  });

  describe('light theme', function () {
    stopAppAfterEach();

    beforeEach(async function () {
      this.app = newApp({ theme: 'light' });
      await this.app.start();
    });

    it('has the correct background color', async function () {
      const color = await getBackgroundColor(this.app);

      assert.equal(color, '#fff');
    });
  });
});
