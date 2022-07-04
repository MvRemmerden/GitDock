const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Application launch', function () {
  test.beforeEach(async function () {
    await newApp(this);
  });

  stopAppAfterEach();

  test('starts the menubar window', async function () {
    const windows = await this.app.windows();
    await this.window.screenshot({
      path: 'test-results/screenshots/launch/starts-the-menubar-window.png',
      fullPage: true,
    });
    expect(windows.length).toEqual(1);
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
    await this.window.click('#login-instance-button');
    await this.window.waitForNavigation();

    const issues = this.window.locator('#issues-count');
    const mrs = this.window.locator('#mrs-count');
    const todos = this.window.locator('#todos-count');

    await this.window.screenshot({
      path: 'test-results/screenshots/launch/can-log-in.png',
      fullPage: true,
    });
    expect(await issues.count()).toBe(1);
    expect(await mrs.count()).toBe(1);
    expect(await todos.count()).toBe(1);
  });
});
