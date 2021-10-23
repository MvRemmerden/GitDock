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
