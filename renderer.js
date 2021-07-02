function goToDetail(page, object) {
    let value = {
        page: page,
        object: object
    }
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
    window.electron.goToDetail(value)
}

function goToOverview() {
    window.electron.goToOverview()
    document.getElementById('detail-view').style.left = '100vw'
    document.getElementById('detail-content').innerHTML = ''
    document.getElementById('detail-headline').innerHTML = ''
    document.body.style.overflow = 'auto'
}

function switchIssues(url, label) {
    let value = {
        url: url,
        label: label
    }
    window.electron.switchIssues(value)
}

function switchMRs(url, label) {
    let value = {
        url: url,
        label: label
    }
    window.electron.switchMRs(value)
}

function switchPage(url, type) {
    let value = {
        url: url,
        type: type
    }
    window.electron.switchPage(value)
}

function searchRecent(input) {
    window.electron.searchRecent(input.value)
}

function changeCommit(value) {
    window.electron.changeCommit(value)
}

function changeProjectCommit(value) {
    window.electron.changeProjectCommit(value)
}

function addBookmark(value) {
    window.electron.addBookmark(value)
}

function startBookmarkDialog() {
    window.electron.startBookmarkDialog()
}

function deleteBookmark(value) {
    window.electron.deleteBookmark(value)
}

function changeTheme(value) {
    window.electron.changeTheme(value)
}