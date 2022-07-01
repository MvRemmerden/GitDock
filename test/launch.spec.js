const expect = require('@playwright/test').expect;
const test = require('@playwright/test').test;
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Application launch', function () {
  //this.timeout(25000);

  test.beforeEach(async function () {
    await newApp(this);
  });

  stopAppAfterEach();

  test('starts the menubar window', async function () {
    const windows = await this.app.windows();
    expect(windows.length).toEqual(1);
    expect(await windows[0].title()).toEqual('GitDock');
    await expect(windows[0]).toHaveScreenshot('launch-menubar.png');
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

    expect(await issues.count()).toBe(1);
    expect(await mrs.count()).toBe(1);
    expect(await todos.count()).toBe (1);
  }) ;
}) ;
