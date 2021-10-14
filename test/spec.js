const Application = require('spectron').Application;
const assert = require('assert');
const electronPath = require('electron');
const path = require('path');

describe('Application launch', function () {
  this.timeout(25000);
  beforeEach(function (done) {
    this.app = new Application({
      path: electronPath,
      args: [
        '--no-sandbox',
        '--ignore-certificate-error',
        '--disable-dev-shm-usage',
        '--whitelisted-ips=',
        path.join(__dirname, '..'),
      ],
      env: { NODE_ENV: 'test' },
    });
    this.app.start().then(() => {
      done();
    });
  });
  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

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

describe('Feature tests', function () {
  this.timeout(25000);
  beforeEach(function (done) {
    this.app = new Application({
      path: electronPath,
      args: [
        '--no-sandbox',
        '--ignore-certificate-error',
        '--disable-dev-shm-usage',
        '--whitelisted-ips=',
        path.join(__dirname, '..'),
      ],
      env: { NODE_ENV: 'test', LOGGED_IN: 'true' },
    });
    this.app.start().then(() => {
      done();
    });
  });
  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

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
  it('adds and deletes bookmark', async function () {
    let bookmark = await this.app.client.$('#bookmark-link');
    await bookmark.setValue('https://gitlab.com/gitlab-org/gitlab/-/issues/1');
    let button = await this.app.client.$('#bookmark-add-button');
    return button
      .click()
      .then(async () => {})
      .then(async () => {
        let title = await this.app.client.$('#bookmark-title');
        await title.waitForExist({ timeout: 5000 });
        let text = await title.getText();
        assert.equal(text, '500 error on MR approvers edit page (#1)');
        let button = await this.app.client.$('.bookmark-delete');
        return button.click();
      })
      .then(async () => {
        let bookmark = await this.app.client.$('#bookmark-link');
        await bookmark.waitForExist({ timeout: 5000 });
        let bookmarkExists = await bookmark.isExisting();
        assert.equal(bookmarkExists, true);
      });
  });
});
