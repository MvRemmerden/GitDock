const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Feature tests', function () {
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
