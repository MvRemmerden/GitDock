const { test, expect } = require('@playwright/test');
const { stopAppAfterEach, newApp } = require('./util');

test.describe('"Bookmarks" section', function () {
  const addBookmark = async (window, link) => {
    await window.fill('#bookmark-link', link);
    await window.click('#bookmark-add-button');
  };

  test.describe('without bookmarks', () => {
    test.beforeEach(async function () {
      await newApp(this, {
        loggedIn: true,
      });
    });

    stopAppAfterEach();

    test('can add and delete a bookmark', async function () {
      await addBookmark(this.window, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');

      const title = this.window.locator('#bookmark-title');
      expect(await title.innerText()).toEqual('500 error on MR approvers edit page (#1)');

      await this.window.click('.bookmark-delete');

      const bookmarkInput = this.window.locator('#bookmark-link');
      expect(await bookmarkInput.count()).toEqual(1);
      expect(await title.count()).toEqual(0);
    });
  });

  test.describe('with bookmarks', () => {
    const FIRST_BOOKMARK_URL = 'https://gitlab.com/user/project/-/merge_requests/1';

    test.beforeEach(async function () {
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

    test('can delete a bookmark', async function () {
      const title = this.window.locator('#bookmark-title');
      expect(await title.count()).toEqual(1);

      await this.window.click('.bookmark-delete');

      expect(await title.count()).toEqual(0);
    });

    test('can add a bookmark', async function () {
      await this.window.click('#add-bookmark-dialog a');

      await addBookmark(this.window, 'https://gitlab.com/gitlab-org/gitlab/-/issues/1');

      const titles = this.window.locator('.bookmark-information a');
      expect(await titles.count()).toEqual(2);
    });

    test('cannot add a bookmark twice', async function () {
      await this.window.click('#add-bookmark-dialog a');

      await addBookmark(this.window, FIRST_BOOKMARK_URL);
      expect(await this.window.textContent('#add-bookmark-error')).toEqual(
        'This bookmark has already been added.',
      );
    });
  });
});
