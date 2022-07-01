const expect = require('@playwright/test').expect;
const test = require('@playwright/test').test;
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Feature tests', function () {
  test.setTimeout(120000);

  test.beforeEach(async function () {
    await newApp(this, {
      loggedIn: true,
    });
  });

  stopAppAfterEach();

  test('shows overview page', async function () {
    const issues = this.window.locator('#issues-count');
    const mrs = this.window.locator('#mrs-count');
    const todos = this.window.locator('#todos-count');

    expect(await issues.count()).toBe(1);
    expect(await mrs.count()).toBe(1);
    expect(await todos.count()).toBe(1);
  });
});
