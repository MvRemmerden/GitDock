/* eslint-disable no-unused-vars */
function goToDetail(page, object) {
  const value = {
    page,
    object,
  };
  document.getElementById('detail-view').style.left = 0;
  document.body.style.overflow = 'hidden';
  window.electron.goToDetail(value);
}

function goBackToDetail() {
  document.getElementById('sub-detail-view').style.left = '100vw';
  window.electron.goBackToDetail();
}

function goToSubDetail(page, project, all = false) {
  const value = {
    page,
    project,
    all,
  };
  document.getElementById('sub-detail-view').style.left = 0;
  window.electron.goToSubDetail(value);
}

function goToOverview() {
  window.electron.goToOverview();
  document.getElementById('detail-view').style.left = '100vw';
  document.getElementById('detail-content').innerHTML = '';
  document.getElementById('detail-headline').innerHTML = '';
  document.body.style.overflow = 'auto';
}

function goToSettings() {
  window.electron.goToSettings();
}

function switchIssues(value, type, text) {
  const object = {
    label: value,
    type,
    text,
  };
  window.electron.switchIssues(object);
}

function switchMRs(value, type, text) {
  const object = {
    label: value,
    type,
    text,
  };
  window.electron.switchMRs(object);
}

function switchPage(url, type) {
  const value = {
    url,
    type,
  };
  window.electron.switchPage(value);
}

function searchRecent(input) {
  window.electron.searchRecent(input.value);
}

function changeCommit(value) {
  window.electron.changeCommit(value);
}

function changeProjectCommit(value) {
  window.electron.changeProjectCommit(value);
}

function addBookmark(value) {
  window.electron.addBookmark(value);
}

function addProject(input, target) {
  const value = {
    input,
    target,
  };
  window.electron.addProject(value);
}

function addShortcut(value) {
  window.electron.addShortcut(value);
}

function startBookmarkDialog() {
  window.electron.startBookmarkDialog();
}

function startProjectDialog() {
  window.electron.startProjectDialog();
}

function startShortcutDialog() {
  window.electron.startShortcutDialog();
}

function deleteBookmark(value) {
  window.electron.deleteBookmark(value);
}

function deleteProject(value) {
  window.electron.deleteProject(value);
}

function deleteShortcut(value) {
  window.electron.deleteShortcut(value);
}

function changeTheme(value) {
  window.electron.changeTheme(value);
}

function changeAnalytics(value) {
  window.electron.changeAnalytics(value);
}

function changeKeepVisible(value) {
  window.electron.changeKeepVisible(value);
}

function changeShowDockIcon(value) {
  window.electron.changeShowDockIcon(value);
}

function startLogin() {
  window.electron.startLogin();
}

function startManualLogin(accessToken, host) {
  const value = {
    access_token: accessToken,
    host,
  };
  window.electron.startManualLogin(value);
}

function logout() {
  window.electron.logout();
}
