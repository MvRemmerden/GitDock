// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
function goToDetail(page) {
    document.getElementById('detail-view').style.left = 0
    document.body.style.overflow = 'hidden'
    console.log(page)
}
function goToOverview() {
    document.getElementById('detail-view').style.left = '100vw'
    document.body.style.overflow = 'auto'
}