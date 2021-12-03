const assert = require('assert');
const { stopAppAfterEach, newApp } = require('./util');

describe('"Bookmarks" section', function () {
  this.timeout(25000);

  const addBookmark = async (app, link) => {
    const bookmarkInput = await app.client.$('#bookmark-link');
    await bookmarkInput.setValue(link);
    const addButton = await app.client.$('#bookmark-add-button');
    await addButton.click();
  };

  describe('without bookmarks', function () {
    beforeEach(async function () {
      this.app = newApp({ loggedIn: true });
      await this.app.start();
    });

    stopAppAfterEach();

    it('can add and delete a bookmark', async function () {
      await addBookmark(this.app, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');

      const title = await this.app.client.$('#bookmark-title');
      assert.equal(await title.isExisting(), true);
      assert.equal(await title.getText(), '500 error on MR approvers edit page (#1)');

      const deleteButton = await this.app.client.$('.bookmark-delete');
      await deleteButton.click();

      const bookmarkInput = await this.app.client.$('#bookmark-link');
      assert.equal(await bookmarkInput.isExisting(), true);
      assert.equal(await title.isExisting(), false);
    });
  });

  describe('with bookmarks', function () {
    beforeEach(async function () {
      this.app = newApp({
        loggedIn: true,
        bookmarks: [
          {
            added: Date.now(),
            title: 'Test Merge Request (!1)',
            parent_name: 'Test Project',
            parent_url: 'https://gitlab.com/user/project',
            type: 'merge_request',
            web_url: 'https://gitlab.com/user/project/-/merge_requests/1',
          },
        ],
      });
      await this.app.start();
    });

    stopAppAfterEach();

    it('can delete a bookmark', async function () {
      const title = await this.app.client.$('#bookmark-title');
      assert.equal(await title.isExisting(), true);

      const deleteButton = await this.app.client.$('.bookmark-delete');
      await deleteButton.click();

      assert.equal(await title.isExisting(), false);
    });

    it('can add a bookmark', async function () {
      const addBookmarksButton = await this.app.client.$('#add-bookmark-dialog a');
      await addBookmarksButton.click();

      await addBookmark(this.app, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');
      const titles = await this.app.client.$$('.bookmark-information a');
      assert.equal(titles.length, 2);
    });

    it('cannot add a bookmark twice', async function () {
      const addBookmarksButton = await this.app.client.$('#add-bookmark-dialog a');
      await addBookmarksButton.click();

      await addBookmark(this.app, 'https://gitlab.com/user/project/-/merge_requests/1');
      const error = await this.app.client.$('#add-bookmark-error');
      assert.equal(await error.getText(), 'This bookmark has already been added.');
    });
  });
});
