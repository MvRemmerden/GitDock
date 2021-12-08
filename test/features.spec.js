const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Feature tests', function () {
  this.timeout(25000);

  beforeEach(async function () {
    await newApp(this, { loggedIn: true });
  });

  stopAppAfterEach();

  it('shows overview page', async function () {
    const issues = this.window.locator('#issues-count');
    const mrs = this.window.locator('#mrs-count');
    const todos = this.window.locator('#todos-count');

    assert.equal(await issues.count(), 1);
    assert.equal(await mrs.count(), 1);
    assert.equal(await todos.count(), 1);
  });
});
