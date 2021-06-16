function goToDetail(page, object) {
    let value = {
        page: page,
        object: object
    }
    window.electron.doThing(value)
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
}
function goToOverview() {
    document.getElementById('detail-view').style.left = '100vw'
    document.body.style.overflow = 'auto'
}