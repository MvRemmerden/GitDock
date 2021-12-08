const assert = require('assert');
const { stopAppAfterEach, newApp } = require('./util');

describe('"Bookmarks" section', function () {
  this.timeout(25000);

  const addBookmark = async (window, link) => {
    let element = await window.$('#bookmark-link');
    await element.fill(link);
    await window.click('#bookmark-add-button');
  };

  describe('without bookmarks', function () {
    beforeEach(async function () {
      await newApp(this, { loggedIn: true });
    });

    stopAppAfterEach();

    it('can add and delete a bookmark', async function () {
      await addBookmark(this.window, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');

      const title = this.window.locator('#bookmark-title');
      assert.equal(await title.innerText(), '500 error on MR approvers edit page (#1)');

      await this.window.click('.bookmark-delete');

      const bookmarkInput = this.window.locator('#bookmark-link');
      assert.equal(await bookmarkInput.count(), 1);
      assert.equal(await title.count(), 0);
    });
  });

  describe('with bookmarks', function () {
    const FIRST_BOOKMARK_URL = 'https://gitlab.com/user/project/-/merge_requests/1';

    beforeEach(async function () {
      await newApp(this, {
        loggedIn: true,
        bookmarks: [
          {
            added: Date.now(),
            title: 'Test Merge Request (!1)',
            parent_name: 'Test Project',
            parent_url: 'https://gitlab.com/user/project',
            type: 'merge_request',
            web_url: FIRST_BOOKMARK_URL,
          },
        ],
      });
    });

    stopAppAfterEach();

    it('can delete a bookmark', async function () {
      const title = this.window.locator('#bookmark-title');
      assert.equal(await title.count(), 1);

      await this.window.click('.bookmark-delete');

      assert.equal(await title.count(), 0);
    });

    it('can add a bookmark', async function () {
      await this.window.click('#add-bookmark-dialog a');

      await addBookmark(this.window, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');

      const titles = this.window.locator('.bookmark-information a');
      assert.equal(await titles.count(), 2);
    });

    it('cannot add a bookmark twice', async function () {
      await this.window.click('#add-bookmark-dialog a');

      await addBookmark(this.window, FIRST_BOOKMARK_URL);

      assert.equal(
        await this.window.textContent('#add-bookmark-error'),
        'This bookmark has already been added.',
      );
    });
  });
});
