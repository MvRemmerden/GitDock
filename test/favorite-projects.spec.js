const { test, expect } = require('@playwright/test');
const { newApp, stopAppAfterEach } = require('./util');

test.describe('Favorite projects', function () {
  const EXAMPLE_PROJECT = {
    added: Date.now(),
    type: 'projects',
    web_url: 'https://gitlab.com/mvanremmerden/gitdock',
    id: 28462485,
    visibility: 'public',
    name: 'GitDock ⚓️',
    title: 'GitDock ⚓️',
    namespace: {
      name: 'Marcel van Remmerden',
    },
    parent_name: 'Marcel van Remmerden / GitDock ⚓️',
    parent_url: 'https://gitlab.com/mvanremmerden',
    name_with_namespace: 'Marcel van Remmerden / GitDock ⚓️',
    open_issues_count: 52,
    last_activity_at: '2022-01-31T09:55:37.993Z',
    avatar_url: 'https://gitlab.com/uploads/-/system/project/avatar/28462485/gitlab.png',
    star_count: 124,
    forks_count: 17,
  };

  const listFavoriteProjects = async (window) =>
    window.locator('[data-testid="favorite-projects"] li').allTextContents();

  const openSettings = async (window) => {
    await window.click('#edit-favorite-projects');
    await window.waitForSelector('#favorite-projects');
  };

  const addProject = async (window, url) => {
    await window.click('#add-project-dialog a');
    await window.fill('#project-settings-link', url);
    await window.click('#project-settings-add-button');
    await window.waitForSelector('#add-project-dialog a');
  };

  test.beforeEach(async function () {
    await newApp(this, {
      loggedIn: true,
    });
  });

  stopAppAfterEach();

  test('shows no favorite projects', async function () {
    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/shows-no-favorite-projects.png', fullPage: true});
    expect((await listFavoriteProjects(this.window)).length).toEqual(0);
  });

  test('adds a new project', async function () {
    await openSettings(this.window);
    await addProject(this.window, EXAMPLE_PROJECT.web_url);

    await this.window.click('#detail-header');
    await this.window.waitForSelector('[data-testid="favorite-projects"]');

    const projects = await listFavoriteProjects(this.window);

    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/adds-a-new-favorite-project.png', fullPage: true});
    expect(projects.length).toEqual(1);
    expect(projects[0].includes(EXAMPLE_PROJECT.name)).toBe(true);
    expect(projects[0].includes(EXAMPLE_PROJECT.namespace.name)).toBe(true);
  });

  test('shows the correct project link', async function () {
    await newApp(this, {
      loggedIn: true,
      favoriteProjects: [EXAMPLE_PROJECT],
    });

    const onclick = await this.window
      .locator('[data-testid="favorite-projects"] li')
      .getAttribute('onclick');
      await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/shows-the-correct-project-link.png', fullPage: true});
    expect(onclick).toEqual(`goToDetail('Project', '${JSON.stringify(EXAMPLE_PROJECT)}')`);
  });

  test('deletes an existing project', async function () {
    await newApp(this, {
      loggedIn: true,
      favoriteProjects: [EXAMPLE_PROJECT],
    });
    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/deletes-an-existing-project-1.png', fullPage: true});
    expect((await listFavoriteProjects(this.window)).length).toEqual(1);

    await this.window.click('#edit-favorite-projects');
    await this.window.waitForSelector('#favorite-projects');
    await this.window.click('#favorite-projects .bookmark-delete');

    await this.window.click('#detail-header');
    await this.window.waitForTimeout(100);

    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/deletes-an-existing-project-2.png', fullPage: true});
    expect((await listFavoriteProjects(this.window)).length).toEqual(0);
  });

  test('prevents adding a project twice', async function () {
    await newApp(this, {
      loggedIn: true,
      favoriteProjects: [EXAMPLE_PROJECT],
    });

    await openSettings(this.window);

    await this.window.click('#add-project-dialog a');
    await this.window.fill('#project-settings-link', EXAMPLE_PROJECT.web_url);
    await this.window.click('#project-settings-add-button');
    await this.window.waitForSelector('#add-project-settings-error');

    const error = this.window.locator('#add-project-settings-error');

    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/prevents-adding-a-project-twice-1.png', fullPage: true});
    expect(await error.innerText()).toEqual('The same project was already added.');

    await this.window.click('#detail-header');
    await this.window.waitForTimeout(100);

    await this.window.screenshot({path: 'test-results/screenshots/favorite-projects/prevents-adding-a-project-twice-2.png', fullPage: true});
    expect((await listFavoriteProjects(this.window)).length).toEqual(1);
  });
});
