const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Feature tests', function () {
  this.timeout(25000);

  beforeEach(async function () {
    this.app = newApp({ loggedIn: true });
    await this.app.start();
  });

  stopAppAfterEach();

  it('shows overview page', async function () {
    let issues = await this.app.client.$('#issues-count');
    let mrs = await this.app.client.$('#mrs-count');
    let todos = await this.app.client.$('#todos-count');
    await issues.waitForExist({ timeout: 5000 });
    let issuesExists = await issues.isExisting();
    let mrsExists = await mrs.isExisting();
    let todosExists = await todos.isExisting();
    assert.equal(issuesExists, true);
    assert.equal(mrsExists, true);
    assert.equal(todosExists, true);
  });
});
