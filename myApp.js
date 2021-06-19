const { menubar } = require('menubar')
const { Menu, shell, ipcMain } = require("electron")
const fetch = require('node-fetch');
const Store = require('electron-store');
const store = new Store()
const BrowserHistory = require('node-browser-history');

let access_token = store.get('access_token')
let user_id = store.get('user_id')
let username = store.get('username')
let recentlyVisitedString = ''
let numberOfRecentlyVisited = 3
let numberOfRecentComments = 3
let numberOfFavoriteProjects = 5
let numberOfIssues = 1
let numberOfMRs = 1
let numberOfTodos = 1
let activeIssuesOption = 'assigned_to_me'
let activeMRsOption = 'assigned_to_me'

const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlab.png',
    browserWindow: {
        width: 1000,
        height: 650,
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        }
    }
});

if (access_token && user_id && username) {
    setupSecondaryMenu()
    mb.on('after-create-window', () => {
        mb.window.webContents.openDevTools()
        ipcMain.on('detail-page', (event, arg) => {
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = ""')
            mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
            if (arg.page == 'Project') {
                let project = JSON.parse(arg.object)
                displayProjectPage(project)
                fetch('https://gitlab.com/api/v4/projects/' + project.id + '/repository/commits/?per_page=1&access_token=' + access_token).then(result => {
                    return result.json()
                }).then(commits => {
                    fetch('https://gitlab.com/api/v4/projects/' + project.id + '/repository/commits/' + commits[0].id + '?access_token=' + access_token).then(result => {
                        return result.json()
                    }).then(commit => {
                        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "<div id=\\"project-pipeline\\">' + displayCommit(commit, project) + '</div>"')
                    })
                })
            } else {
                if (arg.page == 'Issues') {
                    let assigned = "'assigned_to_me'"
                    let created = "'created_by_me'"
                    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"segmented-control\\"><div id=\\"issues_assigned_to_me\\" class=\\"option active\\" onclick=\\"switchIssues(' + assigned + ')\\">Assigned</div><div id=\\"issues_created_by_me\\" class=\\"option\\" onclick=\\"switchIssues(' + created + ')\\">Created</div></div>"')
                    getIssues()
                } else if (arg.page == 'Merge requests') {
                    let assigned = "'assigned_to_me'"
                    let created = "'created_by_me'"
                    let reviewed = "'review_requests_for_me'"
                    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"segmented-control\\"><div id=\\"mrs_assigned_to_me\\" class=\\"option active\\" onclick=\\"switchMRs(' + assigned + ')\\">Assigned</div><div id=\\"mrs_review_requests_for_me\\" class=\\"option\\" onclick=\\"switchMRs(' + reviewed + ')\\">Review requests</div><div id=\\"mrs_created_by_me\\" class=\\"option\\" onclick=\\"switchMRs(' + created + ')\\">Created</div></div>"')
                    getMRs()
                } else if (arg.page == 'To-Do list') {
                    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span>"')
                    getTodos()
                }
            }
        })

        ipcMain.on('switch-issues', (event, arg) => {
            if (arg != activeIssuesOption) {
                mb.window.webContents.executeJavaScript('document.getElementById("issues_' + activeIssuesOption + '").classList.remove("active")')
                mb.window.webContents.executeJavaScript('document.getElementById("issues_' + arg + '").classList.add("active")')
                activeIssuesOption = arg
                mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
                getIssues(arg)
            }
        })

        ipcMain.on('switch-mrs', (event, arg) => {
            if (arg != activeMRsOption) {
                mb.window.webContents.executeJavaScript('document.getElementById("mrs_' + activeMRsOption + '").classList.remove("active")')
                mb.window.webContents.executeJavaScript('document.getElementById("mrs_' + arg + '").classList.add("active")')
                activeMRsOption = arg
                mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
                getMRs(arg)
            }
        })

        ipcMain.on('switch-page', (event, arg) => {
            mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
            getTodos(arg.url)
        })

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
        getUser()
        getLastCommits()
        getRecentComments()
        getRecentlyVisited()
        getUsersProjects()
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
            { label: 'Settings', click: () => { mb.app.quit(); } },
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

function getUser() {
    fetch('https://gitlab.com/api/v4/user?access_token=' + access_token).then(result => {
        return result.json()
    }).then(user => {
        let userString = '<a href=\\"' + user.web_url + '\\" target=\\"_blank\\"><img src=\\"' + user.avatar_url + '\\" /><div class=\\"user-information\\"><span class=\\"user-name\\">' + user.name + '</span><span class=\\"username\\">@' + user.username + '</span></div></a>'
        mb.window.webContents.executeJavaScript('document.getElementById("user").innerHTML = "' + userString + '"')
    })
    fetch('https://gitlab.com/api/v4/issues_statistics?scope=all&assignee_id=' + user_id + '&access_token=' + access_token).then(result => {
        return result.json()
    }).then(stats => {
        mb.window.webContents.executeJavaScript('document.getElementById("issues-count").innerHTML = "' + stats.statistics.counts.opened + '"')
    })
    fetch('https://gitlab.com/api/v4/user_counts?&access_token=' + access_token).then(result => {
        return result.json()
    }).then(stats => {
        let count = Number(stats.assigned_merge_requests) + Number(stats.review_requested_merge_requests)
        mb.window.webContents.executeJavaScript('document.getElementById("mrs-count").innerHTML = "' + count + '"')
    })
    fetch('https://gitlab.com/api/v4/todos?&per_page=1&pagination=keyset&access_token=' + access_token).then(result => {
        let count = result.headers.get('x-total')
        mb.window.webContents.executeJavaScript('document.getElementById("todos-count").innerHTML = "' + count + '"')
        return result.json()
    })
}

async function getRecentlyVisited() {
    recentlyVisitedString = '<ul class=\\"list-container\\">'
    recentlyVisitedArray = new Array()
    await BrowserHistory.getAllHistory(14320).then(async history => {
        if (history.length == 2) {
            history[0] = history[0].concat(history[1])
            history.splice(1, 1)
        }
        await history.forEach(async item => {
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
                if (item[j].title && item[j].url.indexOf('https://gitlab.com/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !recentlyVisitedArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ') {
                    let nameWithNamespace = item[j].url.replace('https://gitlab.com/', '').split('/-/')[0]
                    if (nameWithNamespace.split('/')[0] != 'groups') {
                        url = 'https://gitlab.com/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
                    } else {
                        url = 'https://gitlab.com/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
                    }
                    let response = await fetch(url)
                    let project = await response.json()
                    recentlyVisitedArray.push(item[j].title)
                    recentlyVisitedString += '<li class=\\"history-entry\\">'
                    //recentlyVisitedString += '<img src=\\"' + project.avatar_url + '\\"><div class=\\"history-entry-information\\">'
                    recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item[j].utc_time + ' UTC')) + ' ago &middot; ' + item[j].title.split('·')[2].trim() + '</span></div></li>'
                    i++
                    if (i == numberOfRecentlyVisited) {
                        break
                    }
                }
            }
            recentlyVisitedString += '</ul>'
            mb.window.webContents.executeJavaScript('document.getElementById("history").innerHTML = "' + recentlyVisitedString + '"')
        })
    })
}

function getLastCommits() {
    fetch('https://gitlab.com/api/v4/events?action=pushed&per_page=1&access_token=' + access_token).then(result => {
        return result.json()
    }).then(commits => {
        fetch('https://gitlab.com/api/v4/projects/' + commits[0].project_id + '?access_token=' + access_token).then(result => {
            return result.json()
        }).then(project => {
            fetch('https://gitlab.com/api/v4/projects/' + project.id + '/repository/commits/' + commits[0].push_data.commit_to + '?access_token=' + access_token).then(result => {
                return result.json()
            }).then(commit => {
                mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "' + displayCommit(commit, project) + '"')
            })
        })
    })
}

function getUsersProjects() {
    fetch('https://gitlab.com/api/v4/users/' + user_id + '/starred_projects?min_access_level=30&per_page=' + numberOfFavoriteProjects + '&order_by=updated_at&access_token=' + access_token).then(result => {
        return result.json()
    }).then(projects => {
        let favoriteProjectsString = ''
        let chevron = '<svg class=\\"chevron\\" xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#fff\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\" /></svg>'
        for (project of projects) {
            //TODO Figure out a way to see avatars of private repositories
            /*if(project.visibility == 'public') {
                favoriteProjectsString += '<li><img src=\\"' + project.avatar_url + '\\">'
            }else{*/
            let projectString = "'Project'"
            let projectObject = {
                id: project.id,
                visibility: project.visibility,
                web_url: project.web_url,
                name: project.name,
                namespace: {
                    name: project.namespace.name
                },
                name_with_namespace: project.name_with_namespace,
                open_issues_count: project.open_issues_count,
                last_activity_at: project.last_activity_at,
                avatar_url: project.avatar_url,
                star_count: project.star_count,
                forks_count: project.forks_count,
            }
            let projectJson = "'" + escapeHtml(JSON.stringify(projectObject)) + "'"
            favoriteProjectsString += '<li onclick=\\"goToDetail(' + projectString + ', ' + projectJson + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\"><path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M2 13.122a1 1 0 00.741.966l7 1.876A1 1 0 0011 14.998V14h2a1 1 0 001-1V3a1 1 0 00-1-1h-2v-.994A1 1 0 009.741.04l-7 1.876A1 1 0 002 2.882v10.24zM9 2.31v11.384l-5-1.34V3.65l5-1.34zM11 12V4h1v8h-1z\\" fill=\\"#fff\\"/></svg>'
            favoriteProjectsString += '<div class=\\"name-with-namespace\\"><span>' + project.name + '</span><span class=\\"namespace\\">' + project.namespace.name + '</span></div>' + chevron + '</li>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("projects").innerHTML = "' + favoriteProjectsString + '"')
    })
}

function getRecentComments() {
    let recentCommentsString = '<ul class=\\"list-container\\">'
    fetch('https://gitlab.com/api/v4/events?action=commented&per_page=' + numberOfRecentComments + '&access_token=' + access_token).then(result => {
        return result.json()
    }).then(async comments => {
        for (comment of comments) {
            let url = ''
            if (comment.note.noteable_type == 'MergeRequest') {
                url = 'https://gitlab.com/api/v4/projects/' + comment.project_id + '/merge_requests/' + comment.note.noteable_iid + '?access_token=' + access_token
            } else if (comment.note.noteable_type == 'Issue') {
                url = 'https://gitlab.com/api/v4/projects/' + comment.project_id + '/issues/' + comment.note.noteable_iid + '?access_token=' + access_token
            } else if (comment.noteableType == 'Epic') {
                break
            }
            await fetch(url).then(result => {
                return result.json()
            }).then(collabject => {
                recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; ' + escapeHtml(comment.target_title) + '</span></div></li>'
            })
        }
        recentCommentsString += '</ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("comments").innerHTML = "' + recentCommentsString + '"')
    })
}

function getIssues(scope = 'assigned_to_me') {
    let assignedIssuesString = '<ul class=\\"list-container\\">'
    fetch('https://gitlab.com/api/v4/issues?scope=' + scope + '&state=opened&order_by=updated_at&per_page=' + numberOfIssues + '&access_token=' + access_token).then(result => {
        return result.json()
    }).then(issues => {
        for (issue of issues) {
            assignedIssuesString += '<li class=\\"history-entry\\">'
            assignedIssuesString += '<a href=\\"' + issue.web_url + '\\" target=\\"_blank\\">' + escapeHtml(issue.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(issue.updated_at)) + ' ago &middot; ' + issue.references.full.split('#')[0] + '</span></div></li>'

        }
        assignedIssuesString += '</ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + assignedIssuesString + '"')
    })
}

function getMRs(scope = 'assigned_to_me') {
    let variable = ''
    if (scope == 'review_requests_for_me') {
        variable = 'scope=all&reviewer_id=' + user_id
    } else {
        variable = 'scope=' + scope
    }
    let mrsString = '<ul class=\\"list-container\\">'
    fetch('https://gitlab.com/api/v4/merge_requests?' + variable + '&state=opened&order_by=updated_at&per_page=' + numberOfMRs + '&access_token=' + access_token).then(result => {
        return result.json()
    }).then(mrs => {
        for (mr of mrs) {
            mrsString += '<li class=\\"history-entry\\">'
            mrsString += '<a href=\\"' + mr.web_url + '\\" target=\\"_blank\\">' + escapeHtml(mr.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(mr.updated_at)) + ' ago &middot; ' + mr.references.full.split('#')[0] + '</span></div></li>'

        }
        mrsString += '</ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + mrsString + '"')
    })
}

function getTodos(url = 'https://gitlab.com/api/v4/todos?per_page=' + numberOfTodos + '&access_token=' + access_token) {
    let todosString = '<ul class=\\"list-container\\">'
    let totalNumber
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        totalNumber = result.headers.get('x-total')
        return result.json()
    }).then(todos => {
        for (todo of todos) {
            todosString += '<li class=\\"history-entry\\">'
            let location = ''
            if (todo.project) {
                location = todo.project.name_with_namespace
            } else if (todo.group) {
                location = todo.group.name
            }
            todosString += '<a href=\\"' + todo.target_url + '\\" target=\\"_blank\\">' + escapeHtml(todo.target.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(todo.updated_at)) + ' ago &middot; ' + location + '</span></div></li>'
        }
        todosString += '</ul>'
        if(totalNumber > numberOfTodos && keysetLinks.indexOf('rel="next"') != -1) {
            let nextLink
            if(keysetLinks.indexOf('rel="prev", <') != -1) {
                nextLink = escapeHtml('"' + keysetLinks.split('rel="prev", ')[1].split('>; rel="next"')[0].substring(1) + '"')
            }else{
                nextLink = escapeHtml('"' + keysetLinks.split('>; rel="next"')[0].substring(1) + '"')
            }
            let type = "'Todos'"
            todosString += '<div id=\\"pagination\\"><button onclick=\\"switchPage(' + nextLink + ', ' + type + ')\\">Next</button></div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + todosString + '"')
    })
}

function displayProjectPage(project) {
    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + project.name + '</span> <span class=\\"namespace\\">' + project.namespace.name + '</span>"')
}

function displayCommit(commit, project) {
    let logo = ''
    if (commit.last_pipeline) {
        if (commit.last_pipeline.status == 'scheduled') {
            logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"7\\"/><circle fill=\\"#FFF\\" style=\\"fill: var(--svg-status-bg, #fff);\\" cx=\\"7\\" cy=\\"7\\" r=\\"6\\"/><g transform=\\"translate(2.75 2.75)\\" fill-rule=\\"nonzero\\"><path d=\\"M4.165 7.81a3.644 3.644 0 1 1 0-7.29 3.644 3.644 0 0 1 0 7.29zm0-1.042a2.603 2.603 0 1 0 0-5.206 2.603 2.603 0 0 0 0 5.206z\\"/><rect x=\\"3.644\\" y=\\"2.083\\" width=\\"1.041\\" height=\\"2.603\\" rx=\\".488\\"/><rect x=\\"3.644\\" y=\\"3.644\\" width=\\"2.083\\" height=\\"1.041\\" rx=\\".488\\"/></g></svg>'
        } else {
            logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" fill=\\"#FFF\\" style=\\"fill: var(--svg-status-bg, #fff);\\"/>'
            if (commit.last_pipeline.status == 'running') {
                logo += '<path d=\\"M7 3c2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.3 0-2.5-.7-3.3-1.7L7 7V3\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'failed') {
                logo += '<path d=\\"M7 5.969L5.599 4.568a.29.29 0 0 0-.413.004l-.614.614a.294.294 0 0 0-.004.413L5.968 7l-1.4 1.401a.29.29 0 0 0 .004.413l.614.614c.113.114.3.117.413.004L7 8.032l1.401 1.4a.29.29 0 0 0 .413-.004l.614-.614a.294.294 0 0 0 .004-.413L8.032 7l1.4-1.401a.29.29 0 0 0-.004-.413l-.614-.614a.294.294 0 0 0-.413-.004L7 5.968z\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'success') {
                logo += '<path d=\\"M6.278 7.697L5.045 6.464a.296.296 0 0 0-.42-.002l-.613.614a.298.298 0 0 0 .002.42l1.91 1.909a.5.5 0 0 0 .703.005l.265-.265L9.997 6.04a.291.291 0 0 0-.009-.408l-.614-.614a.29.29 0 0 0-.408-.009L6.278 7.697z\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'pending') {
                logo += '<path d=\\"M4.7 5.3c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H5c-.2 0-.3-.1-.3-.3V5.3m3 0c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H8c-.2 0-.3-.1-.3-.3V5.3\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'canceled') {
                logo += '<path d=\\"M5.2 3.8l4.9 4.9c.2.2.2.5 0 .7l-.7.7c-.2.2-.5.2-.7 0L3.8 5.2c-.2-.2-.2-.5 0-.7l.7-.7c.2-.2.5-.2.7 0\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'skipped') {
                logo += '<path d=\\"M6.415 7.04L4.579 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L5.341 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L6.415 7.04zm2.54 0L7.119 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L7.881 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L8.955 7.04z\\"/></svg>'
            } else if (commit.last_pipeline.status == 'created') {
                logo += '<circle cx=\\"7\\" cy=\\"7\\" r=\\"3.25\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'preparing') {
                logo += '</g><circle cx=\\"7\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"10\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"4\\" cy=\\"7\\" r=\\"1\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'manual') {
                logo += '<path d=\\"M10.5 7.63V6.37l-.787-.13c-.044-.175-.132-.349-.263-.61l.481-.652-.918-.913-.657.478a2.346 2.346 0 0 0-.612-.26L7.656 3.5H6.388l-.132.783c-.219.043-.394.13-.612.26l-.657-.478-.918.913.437.652c-.131.218-.175.392-.262.61l-.744.086v1.261l.787.13c.044.218.132.392.263.61l-.438.651.92.913.655-.434c.175.086.394.173.613.26l.131.783h1.313l.131-.783c.219-.043.394-.13.613-.26l.656.478.918-.913-.48-.652c.13-.218.218-.435.262-.61l.656-.13zM7 8.283a1.285 1.285 0 0 1-1.313-1.305c0-.739.57-1.304 1.313-1.304.744 0 1.313.565 1.313 1.304 0 .74-.57 1.305-1.313 1.305z\\"/></g></svg>'
            }
        }
    } else {
        logo = '<img src=\\"' + project.avatar_url + '\\" />'
        //TODO When https://gitlab.com/gitlab-org/gitlab/-/issues/20924 is fixed, get users avatar here
        /*await fetch('https://gitlab.com/api/v4/users?search=' + commit.author_email + '&access_token=' + access_token).then(result => {
            return result.json()
        }).then(user => {
            console.log(user[0])
            logo = '<img src=\\"' + user[0].avatar_url + '\\" />'
        })*/
    }
    return '<div class=\\"commit\\">' + logo + '<div class=\\"commit-information\\"><a href=\\"' + commit.web_url + '\\" target=\\"_blank\\">' + commit.title + '</a><div><span class=\\"namespace-with-time\\">' + timeSince(new Date(commit.committed_date.split('.')[0] + 'Z')) + ' ago &middot; ' + project.name_with_namespace + '</span></div></div></div>'
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/`/g, "&#039;")
        .replace(/'/g, "&#039;")
        .replace(/@/g, "&commat;")
        .replace(/[\\]/g, '\\\\')
        .replace(/[\"]/g, '\\\"')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t')
}

function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval >= 2) {
        return Math.floor(interval) + " years";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " year";
    }
    interval = seconds / 2592000;
    if (interval > 2) {
        return Math.floor(interval) + " months";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " month";
    }
    interval = seconds / 86400;
    if (interval > 2) {
        return Math.floor(interval) + " days";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " day";
    }
    interval = seconds / 3600;
    if (interval >= 2) {
        return Math.floor(interval) + " hours";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " hour";
    }
    interval = seconds / 60;
    if (interval > 2) {
        return Math.floor(interval) + " minutes";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " minute";
    }
    return Math.floor(seconds) + " seconds";
}
