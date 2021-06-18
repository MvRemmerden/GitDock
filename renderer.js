function goToDetail(page, object) {
    let value = {
        page: page,
        object: object
    }
    window.electron.goToDetail(value)
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
}

function switchIssues(option) {
    window.electron.switchIssues(option)
}

function goToOverview() {
    document.getElementById('detail-view').style.left = '100vw'
    document.body.style.overflow = 'auto'
}