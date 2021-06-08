const { menubar } = require('menubar')
const { Menu } = require("electron")
const fetch = require('node-fetch');
const Store = require('electron-store');
const store = new Store()
const shell = require('electron').shell
const BrowserHistory = require('node-browser-history');

let access_token = store.get('access_token')
let user_id = store.get('user_id')
let username = store.get('username')
let recentlyVisitedString = ''
let numberOfRecentlyVisited = 10

console.log(access_token)
const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlab.png',
    browserWindow: {
        width: 600,
        height: 600
    }
});

if (access_token && user_id && username) {
    setupSecondaryMenu()
    mb.on('after-create-window', () => {
        mb.window.webContents.openDevTools()

        mb.window.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
        /*store.delete('user_id')
        store.delete('username')
        store.delete('access_token')
        mb.window.webContents.session.clearCache()
        mb.window.webContents.session.clearStorageData()*/
    })

    mb.on('show', () => {
        getRecentlyVisited()

        fetch('https://gitlab.com/api/v4/projects/278964/pipelines?username=mvanremmerden&per_page=5&access_token=' + access_token).then(result => {
            return result.json()
        }).then(result => {
            console.log(result)
        })
    })
} else {
    setupSecondaryMenu()
    mb.on('after-create-window', () => {
        mb.window.loadURL('https://gitlab.com/oauth/authorize?client_id=99c07cc5466cbc721ef2667acd38d3acf45edd2fc314a955861be783585f4be5&redirect_uri=https://gitlab.com&response_type=token&state=test&scope=api')
        mb.window.on('page-title-updated', handleLogin)
    })
}

function setupSecondaryMenu() {
    mb.on('ready', () => {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Quit', click: () => { mb.app.quit(); } }
        ])
        mb.tray.on('right-click', () => {
            mb.tray.popUpContextMenu(contextMenu)
        })
    });
}

function handleLogin() {
    if (mb.window.webContents.getURL().indexOf('#access_token=') != '-1') {
        const code = mb.window.webContents.getURL().split('#access_token=')[1].replace('&token_type=Bearer&state=test', '')
        fetch('https://gitlab.com/api/v4/user?access_token=' + code).then(result => {
            return result.json()
        }).then(result => {
            store.set('access_token', code)
            store.set('user_id', result.id)
            store.set('username', result.username)
            mb.window.loadURL(`file://${__dirname}/index.html`)
            mb.window.removeListener('page-title-updated', handleLogin)
        })
    } else {
        console.log('not loaded')
    }
}

function getRecentlyVisited() {
    recentlyVisitedString = ''
    recentlyVisitedArray = new Array()
    BrowserHistory.getAllHistory(14320).then(history => {
        if (history.length == 2) {
            history[0] = history[0].concat(history[1])
            history.splice(1, 1)
        }
        history.forEach(item => {
            item.sort(function (a, b) {
                if (a.utc_time > b.utc_time) {
                    return -1
                }
                if (b.utc_time > a.utc_time) {
                    return 1
                }
            });
            let i = 0
            for (let j = 0; j < item.length; j++) {
                if (item[j].url.indexOf('https://gitlab.com/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1)) {
                    if(!recentlyVisitedArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found') {
                        recentlyVisitedArray.push(item[j].title)
                        recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a></br></br>'
                        i++
                        if (i == numberOfRecentlyVisited) {
                            break
                        }
                    }
                }
            }
        })
        console.log(recentlyVisitedArray)
        mb.window.webContents.executeJavaScript('document.getElementById("test").innerHTML = "' + recentlyVisitedString + '"')
    })
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

