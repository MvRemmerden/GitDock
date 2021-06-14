function goToDetail(page) {
    window.electron.doThing(page)
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
    console.log(page)
}
function goToOverview() {
    document.getElementById('detail-view').style.left = '100vw'
    document.body.style.overflow = 'auto'
}