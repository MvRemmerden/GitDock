const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Application launch', function () {
  test.beforeEach(async function () {
    await newApp(this);
  });

  stopAppAfterEach();

  test('starts the menubar window', async function () {
    const windows = await this.app.windows();
    expect(windows.length).toEqual(1);
    await expect(windows[0]).toHaveScreenshot();
    expect(await windows[0].title()).toEqual('GitDock');
  });
  test('can log in', async function () {
    await this.window.click('#instance-checkbox');
    this.window.$eval(
      '#access-token-input',
      (el, token) => (el.value = token),
      process.env.ACCESS_TOKEN,
    );
    this.window.$eval('#instance-url-input', (el) => (el.value = 'https://gitlab.com'));
    await this.window.screenshot('1.png');
    await this.window.click('#login-instance-button');
    await this.window.screenshot('2.png');
    await this.window.waitForNavigation();
    await this.window.screenshot('3.png');

    const issues = this.window.locator('#issues-count');
    const mrs = this.window.locator('#mrs-count');
    const todos = this.window.locator('#todos-count');

    expect(await issues.count()).toBe(1);
    expect(await mrs.count()).toBe(1);
    expect(await todos.count()).toBe(1);
  });
});
