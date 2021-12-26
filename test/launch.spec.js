const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Application launch', function () {
  this.timeout(25000);

  beforeEach(async function () {
    await newApp(this);
  });

  stopAppAfterEach();

  it('starts the menubar window', async function () {
    const windows = await this.app.windows();
    assert.equal(windows.length, 1);
  });
  it('can log in', async function () {
    await this.window.click('#instance-checkbox');
    this.window.$eval(
      '#access-token-input',
      (el, token) => (el.value = token),
      process.env.ACCESS_TOKEN,
    );
    this.window.$eval('#instance-url-input', (el) => (el.value = 'https://gitlab.com'));
    await this.window.click('#login-instance-button');
    await this.window.waitForNavigation();

    const issues = this.window.locator('#issues-count');
    const mrs = this.window.locator('#mrs-count');
    const todos = this.window.locator('#todos-count');

    assert.equal(await issues.count(), 1);
    assert.equal(await mrs.count(), 1);
    assert.equal(await todos.count(), 1);
  });
});
