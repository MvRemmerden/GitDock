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

const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlab.png',
    browserWindow: {
        width: 800,
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
        getLastPipeline()
        getUsersProjects()
        getRecentComments()
        getTodos()
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
                if (item[j].url.indexOf('https://gitlab.com/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !recentlyVisitedArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ') {
                    recentlyVisitedArray.push(item[j].title)
                    recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a></br>' + timeSince(new Date(item[j].utc_time + ' UTC')) +' ago (' + new Date(item[j].utc_time + ' UTC').toLocaleString() + ')</br></br>'
                    i++
                    if (i == numberOfRecentlyVisited) {
                        break
                    }
                }
            }
        })
        mb.window.webContents.executeJavaScript('document.getElementById("history").innerHTML = "' + recentlyVisitedString + '"')
    })
}

function getLastPipeline() {
    fetch('https://gitlab.com/api/v4/events?action=pushed&per_page=5&access_token=' + access_token).then(result => {
        return result.json()
    }).then(commits => {
        fetch('https://gitlab.com/api/v4/projects/' + commits[0].project_id + '/pipelines?&username=mvanremmerden&per_page=1&access_token=' + access_token).then(result => {
            return result.json()
        }).then(pipelines => {
            fetch('https://gitlab.com/api/v4/projects/' + commits[0].project_id + '/repository/commits/' + pipelines[0].sha + '?access_token=' + access_token).then(result => {
                return result.json()
            }).then(commit => {
                let logo
                if (commit.last_pipeline.status == 'running') {
                    logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" fill=\\"#FFF\\" style=\\"fill: var(--svg-status-bg, #fff);\\"/><path d=\\"M7 3c2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.3 0-2.5-.7-3.3-1.7L7 7V3\\"/></g></svg>'
                } else if (commit.last_pipeline.status == 'failed') {
                    logo = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 14 14\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" fill=\\"#FFF\\" style=\\"fill: var(--svg-status-bg, #fff);\\"/><path d=\\"M7 5.969L5.599 4.568a.29.29 0 0 0-.413.004l-.614.614a.294.294 0 0 0-.004.413L5.968 7l-1.4 1.401a.29.29 0 0 0 .004.413l.614.614c.113.114.3.117.413.004L7 8.032l1.401 1.4a.29.29 0 0 0 .413-.004l.614-.614a.294.294 0 0 0 .004-.413L8.032 7l1.4-1.401a.29.29 0 0 0-.004-.413l-.614-.614a.294.294 0 0 0-.413-.004L7 5.968z\\"/></g></svg>'
                } else if (commit.last_pipeline.status == 'succeeded') {
                    logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" fill=\\"#FFF\\" style=\\"fill: var(--svg-status-bg, #fff);\\"/><path d=\\"M6.278 7.697L5.045 6.464a.296.296 0 0 0-.42-.002l-.613.614a.298.298 0 0 0 .002.42l1.91 1.909a.5.5 0 0 0 .703.005l.265-.265L9.997 6.04a.291.291 0 0 0-.009-.408l-.614-.614a.29.29 0 0 0-.408-.009L6.278 7.697z\\"/></g></svg>'
                }
                mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "' + logo + '<a href=\\"' + pipelines[0].web_url + '\\" target=\\"_blank\\">' + commit.title + '</a></br>' + commit.last_pipeline.status + ' (' + timeSince(new Date(commit.last_pipeline.updated_at)) + ' ago' + ')<br/></br>"')
            })
        })
    })
}

function getUsersProjects() {
    fetch('https://gitlab.com/api/v4/users/' + user_id + '/starred_projects?min_access_level=30&per_page=4&order_by=updated_at&access_token=' + access_token).then(result => {
        return result.json()
    }).then(projects => {
        projects.forEach(project => {
            fetch('https://gitlab.com/api/v4/projects/' + project.id + '/repository/commits?per_page=1&access_token=' + access_token).then(result => {
                return result.json()
            }).then(commits => {
                commits.forEach(commit => {
                    //console.log(commit)
                })
            })
        })
    })
}

function getRecentComments() {
    fetch('https://gitlab.com/api/v4/events?action=commented&per_page=5&access_token=' + access_token).then(result => {
        return result.json()
    }).then(comments => {
        comments.forEach(comment => {
            //console.log(comment.target_title)
            //console.log(comment.note.body)
        })
    })
}

function getTodos() {
    todosString = ''
    fetch('https://gitlab.com/api/v4/todos?access_token=' + access_token).then(result => {
        return result.json()
    }).then(todos => {
        todos.forEach(todo => {
            //console.log(todo)
            let title
            if (todo.target.title) {
                title = todo.target.title
            } else {
                title = todo.target.filename
            }
            let body
            if (todo.body) {
                let trimmedString = todo.body.substring(0, 75).replace(/\n/g, " ")
                body = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
            } else {
                body = todo.target.description
            }
            todosString += '<a href=\\"' + todo.target_url + '\\" target=\\"_blank\\">' + escapeHtml(title) + '</a></br>' + body + '<br/></br>'
        })
        mb.window.webContents.executeJavaScript('document.getElementById("todos").innerHTML = "' + todosString + '"')
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

function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
