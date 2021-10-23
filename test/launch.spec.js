const assert = require('assert');
const { newApp, stopAppAfterEach } = require('./util');

describe('Application launch', function () {
  this.timeout(25000);

  beforeEach(async function () {
    this.app = newApp();
    return this.app.start();
  });

  stopAppAfterEach();

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1);
    });
  });
  it('has the right size', function () {
    return this.app.client.browserWindow.getSize().then(function (sizes) {
      assert.equal(sizes[0], 550) && assert.equal(sizes[1], 700);
    });
  });
  it('can log in', async function () {
    let element = await this.app.client.$('#instance-checkbox');
    return element
      .click()
      .then(async () => {
        let token = await this.app.client.$('#access-token-input');
        let url = await this.app.client.$('#instance-url-input');
        await token.setValue(process.env.ACCESS_TOKEN);
        await url.setValue('https://gitlab.com');
        let button = await this.app.client.$('#login-instance-button');
        return button.click();
      })
      .then(async () => {
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
});
