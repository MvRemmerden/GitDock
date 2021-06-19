function goToDetail(page, object) {
    let value = {
        page: page,
        object: object
    }
    window.electron.goToDetail(value)
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
}

function goToOverview() {
    document.getElementById('detail-view').style.left = '100vw'
    document.getElementById('detail-content').innerHTML = ''
    document.getElementById('detail-headline').innerHTML = ''
    document.body.style.overflow = 'auto'
}

function switchIssues(option) {
    window.electron.switchIssues(option)
}

function switchMRs(option) {
    window.electron.switchMRs(option)
}

function switchPage(url, type) {
    let value = {
        url: url,
        type: type
    }
    window.electron.switchPage(value)
}