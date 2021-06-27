const { menubar } = require('menubar')
const { Menu, Notification, shell, ipcMain, app } = require("electron")
const fetch = require('node-fetch');
const Store = require('electron-store');
const store = new Store()
const BrowserHistory = require('node-browser-history');
const { URL } = require('url');

const typeParsers = {
    'merge_requests': merge_requests => ({ merge_requests: parseInt(merge_requests, 10) }),
    'issues': issues => ({ issues: parseInt(issues, 10) }),
    'epics': epics => ({ epics: parseInt(epics, 10) }),
    'tree': branch => ({ branch }),
    'commits': branch => ({ branch }),
    'commit': commits => ({ commit })
}

let access_token = store.get('access_token')
let user_id = store.get('user_id')
let username = store.get('username')
let recentlyVisitedString = ''
let moreRecentlyVisitedArray = []
let recentCommits = []
let currentCommit
let numberOfRecentlyVisited = 3
let numberOfFavoriteProjects = 5
let numberOfRecentComments = 3
let numberOfIssues = 10
let numberOfMRs = 10
let numberOfTodos = 10
let numberOfComments = 5
let activeIssuesOption = 'assigned_to_me'
let activeMRsOption = 'assigned_to_me'
let runningPipelineSubscriptions = []
let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlab.png',
    preloadWindow: true,
    browserWindow: {
        width: 600,
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

        //Preloading content
        getUser()
        //getRecentlyVisited()
        getLastCommits()
        getRecentComments()
        getUsersProjects()
        getBookmarks()

        //Regularly relaoading content
        setInterval(function () {
            /*getLastCommits()
            getRecentComments()
            getUsersProjects()
            getBookmarks()*/
        }, 120000);

        //mb.window.webContents.openDevTools()
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
            } else if (arg.page == 'Issues') {
                let assignedUrl = "'https://gitlab.com/api/v4/issues?scope=assigned_to_me&state=opened&order_by=updated_at&per_page=" + numberOfIssues + "&access_token=" + access_token + "'"
                let createdUrl = "'https://gitlab.com/api/v4/issues?scope=created_by_me&state=opened&order_by=updated_at&per_page=" + numberOfIssues + "&access_token=" + access_token + "'"
                let assignedLabel = "'assigned_to_me'"
                let createdLabel = "'created_by_me'"
                mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"segmented-control\\"><div id=\\"issues_assigned_to_me\\" class=\\"option active\\" onclick=\\"switchIssues(' + assignedUrl + ', ' + assignedLabel + ')\\">Assigned</div><div id=\\"issues_created_by_me\\" class=\\"option\\" onclick=\\"switchIssues(' + createdUrl + ', ' + createdLabel + ')\\">Created</div></div>"')
                getIssues()
            } else if (arg.page == 'Merge requests') {
                let assignedUrl = "'https://gitlab.com/api/v4/merge_requests?scope=assigned_to_me&state=opened&order_by=updated_at&per_page=" + numberOfMRs + "&access_token=" + access_token + "'"
                let createdUrl = "'https://gitlab.com/api/v4/merge_requests?scope=created_by_me&state=opened&order_by=updated_at&per_page=" + numberOfMRs + "&access_token=" + access_token + "'"
                let reviewedUrl = "'https://gitlab.com/api/v4/merge_requests?scope=all&reviewer_id=" + user_id + "&state=opened&order_by=updated_at&per_page=" + numberOfMRs + "&access_token=" + access_token + "'"
                let approvedUrl = "'https://gitlab.com/api/v4/merge_requests?scope=all&approved_by_ids[]=" + user_id + "&order_by=updated_at&per_page=" + numberOfMRs + "&access_token=" + access_token + "'"
                let assignedLabel = "'assigned_to_me'"
                let createdLabel = "'created_by_me'"
                let reviewedLabel = "'review_requests_for_me'"
                let approvedLabel = "'approved_by_me'"
                mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"segmented-control\\"><div id=\\"mrs_assigned_to_me\\" class=\\"option active\\" onclick=\\"switchMRs(' + assignedUrl + ', ' + assignedLabel + ')\\">Assigned</div><div id=\\"mrs_review_requests_for_me\\" class=\\"option\\" onclick=\\"switchMRs(' + reviewedUrl + ', ' + reviewedLabel + ')\\">Review requests</div><div id=\\"mrs_created_by_me\\" class=\\"option\\" onclick=\\"switchMRs(' + createdUrl + ', ' + createdLabel + ')\\">Created</div><div id=\\"mrs_approved_by_me\\" class=\\"option\\" onclick=\\"switchMRs(' + approvedUrl + ', ' + approvedLabel + ')\\">Approved</div></div>"')
                getMRs()
            } else if (arg.page == 'To-Do list') {
                mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span>"')
                getTodos()
            } else if (arg.page == 'Recently viewed') {
                getMoreRecentlyVisited()
            } else if (arg.page == 'Comments') {
                mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span>"')
                getMoreRecentComments()
            }
        })

        ipcMain.on('go-to-overview', (event, arg) => {
            activeIssuesOption = 'assigned_to_me'
            activeMRsOption = 'assigned_to_me'
            moreRecentlyVisitedArray = []
        })

        ipcMain.on('switch-issues', (event, arg) => {
            if (arg.label != activeIssuesOption) {
                mb.window.webContents.executeJavaScript('document.getElementById("issues_' + activeIssuesOption + '").classList.remove("active")')
                mb.window.webContents.executeJavaScript('document.getElementById("issues_' + arg.label + '").classList.add("active")')
                activeIssuesOption = arg.label
                mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
                getIssues(arg.url)
            }
        })

        ipcMain.on('switch-mrs', (event, arg) => {
            if (arg.label != activeMRsOption) {
                mb.window.webContents.executeJavaScript('document.getElementById("mrs_' + activeMRsOption + '").classList.remove("active")')
                mb.window.webContents.executeJavaScript('document.getElementById("mrs_' + arg.label + '").classList.add("active")')
                activeMRsOption = arg.label
                mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
                getMRs(arg.url)
            }
        })

        ipcMain.on('switch-page', (event, arg) => {
            mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
            if (arg.type == 'Todos') {
                getTodos(arg.url)
            } else if (arg.type == 'Issues') {
                getIssues(arg.url)
            } else if (arg.type == 'MRs') {
                getMRs(arg.url)
            } else if (arg.type == 'Comments') {
                getMoreRecentComments(arg.url)
            }
        })

        ipcMain.on('search-recent', (event, arg) => {
            mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
            searchRecentlyVisited(arg)
        })

        ipcMain.on('change-commit', (event, arg) => {
            mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "<div class=\\"commit empty\\"><div id=\\"project-name\\"></div><div class=\\"commit-information\\"><div class=\\"commit-name skeleton\\"></div><div class=\\"commit-details skeleton\\"></div></div></div>"')
            changeCommit(arg)
        })

        ipcMain.on('add-bookmark', (event, arg) => {
            addBookmark(arg)
        })

        ipcMain.on('start-bookmark-dialog', (event, arg) => {
            startBookmarkDialog()
        })

        ipcMain.on('delete-bookmark', (event, arg) => {
            let bookmarks = store.get('bookmarks')
            let newBookmarks = bookmarks.filter(bookmark => {
                return bookmark.url != arg
            })
            store.set('bookmarks', newBookmarks)
            getBookmarks()
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
        //getUser()
        getRecentlyVisited()
        getLastCommits()
        getRecentComments()
        getUsersProjects()
        getBookmarks()
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
            { label: 'Settings', click: () => { } },
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
        let userString = '<a href=\\"' + user.web_url + '\\" target=\\"_blank\\"><img src=\\"' + user.avatar_url + '?width=64\\" /><div class=\\"user-information\\"><span class=\\"user-name\\">' + user.name + '</span><span class=\\"username\\">@' + user.username + '</span></div></a>'
        mb.window.webContents.executeJavaScript('document.getElementById("user").innerHTML = "' + userString + '"')
    })
    /*fetch('https://gitlab.com/api/v4/issues_statistics?scope=all&assignee_id=' + user_id + '&access_token=' + access_token).then(result => {
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
    })*/
}

function getLastCommits() {
    fetch(url = 'https://gitlab.com/api/v4/events?action=pushed&per_page=20&access_token=' + access_token).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(commits => {
        getLastPipelines(commits)
        let committedArray = commits.filter(commit => {
            return (commit.action_name == 'pushed to' || (commit.action_name == 'pushed new' && commit.push_data.commit_to && commit.push_data.commit_count > 0))
        })
        currentCommit = committedArray[0]
        recentCommits = committedArray
        getCommitDetails(committedArray[0].project_id, committedArray[0].push_data.commit_to, 1)
    })
}

async function getLastPipelines(commits) {
    let projectArray = []
    for (let commit of commits) {
        if (!projectArray.includes(commit.project_id)) {
            projectArray.push(commit.project_id)
            let result = await fetch('https://gitlab.com/api/v4/projects/' + commit.project_id + '/pipelines?status=success&username=' + username + '&per_page=1&page=1&access_token=' + access_token)
            let pipelines = await result.json()
            if (pipelines.length != 0) {
                mb.tray.setImage(__dirname + '/assets/running.png')
                for (let pipeline of pipelines) {
                    console.log(pipeline.id)
                    if (runningPipelineSubscriptions.findIndex(subscriptionPipeline => subscriptionPipeline.id == pipeline.id) == -1) {
                        let result = await fetch('https://gitlab.com/api/v4/projects/' + pipeline.project_id + '/repository/commits/' + pipeline.sha + '?access_token=' + access_token)
                        let commit = await result.json()
                        pipeline.commit_title = commit.title
                        runningPipelineSubscriptions.push(pipeline)
                        let runningNotification = new Notification({ title: 'Pipeline running', subtitle: parse(pipeline.web_url).namespace + ' / ' + parse(pipeline.web_url).project, body: pipeline.commit_title })
                        runningNotification.on('click', result => {
                            shell.openExternal(pipeline.web_url)
                        })
                        runningNotification.show()
                    }
                }
            }
        }
    }
    subscribeToRunningPipeline()
}

async function subscribeToRunningPipeline() {

    console.log(runningPipelineSubscriptions)

    let interval = setInterval(async function () {
        console.log('update')
        for (let runningPipeline of runningPipelineSubscriptions) {
            let result = await fetch('https://gitlab.com/api/v4/projects/' + runningPipeline.project_id + '/pipelines/' + runningPipeline.id + '?access_token=' + access_token)
            let pipeline = await result.json()
            console.log(pipeline)
            if (pipeline.status != 'running') {
                let updateNotification = new Notification({ title: 'Pipeline succeeded', subtitle: parse(pipeline.web_url).namespace + ' / ' + parse(pipeline.web_url).project, body: runningPipeline.commit_title })
                updateNotification.on('click', () => {
                    shell.openExternal(pipeline.web_url)
                })
                updateNotification.show()
                runningPipelineSubscriptions = runningPipelineSubscriptions.filter(subscriptionPipeline => subscriptionPipeline.id != pipeline.id)
                console.log(runningPipelineSubscriptions)
                //clearInterval(interval)
            }
        }
    }, 2000);
}

function changeCommit(forward = true) {
    let nextCommit
    let index = recentCommits.findIndex(commit => commit.id == currentCommit.id)
    if (forward) {
        if (index == recentCommits.length - 1) {
            nextCommit = recentCommits[0]
            index = 1
        } else {
            nextCommit = recentCommits[index + 1]
            index += 2
        }
    } else {
        if (index == 0) {
            nextCommit = recentCommits[recentCommits.length - 1]
            index = recentCommits.length
        } else {
            nextCommit = recentCommits[index - 1]
        }
    }
    currentCommit = nextCommit
    getCommitDetails(nextCommit.project_id, nextCommit.push_data.commit_to, index)
}

function getCommitDetails(project_id, sha, index) {
    mb.window.webContents.executeJavaScript('document.getElementById("commits-count").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("commits-count").innerHTML = "' + index + '/' + recentCommits.length + '"')
    fetch('https://gitlab.com/api/v4/projects/' + project_id + '?access_token=' + access_token).then(result => {
        return result.json()
    }).then(project => {
        fetch('https://gitlab.com/api/v4/projects/' + project.id + '/repository/commits/' + sha + '?access_token=' + access_token).then(result => {
            return result.json()
        }).then(commit => {
            mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "' + displayCommit(commit, project) + '"')
        })
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
                if (item[j].title && item[j].url.indexOf('https://gitlab.com/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !recentlyVisitedArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New merge request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ') {
                    let nameWithNamespace = item[j].url.replace('https://gitlab.com/', '').split('/-/')[0]
                    if (nameWithNamespace.split('/')[0] != 'groups') {
                        url = 'https://gitlab.com/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
                    } else {
                        url = 'https://gitlab.com/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
                    }
                    recentlyVisitedArray.push(item[j].title)
                    recentlyVisitedString += '<li class=\\"history-entry\\">'
                    recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item[j].utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item[j].url.split('/-/')[0] + '\\" target=\\"_blank\\">' + item[j].title.split('·')[2].trim() + '</a></span></div></li>'
                    i++
                    if (i == numberOfRecentlyVisited) {
                        break
                    }
                }
            }
            let moreString = "'Recently viewed'"
            recentlyVisitedString += '<li class=\\"more-link\\"><a onclick=\\"goToDetail(' + moreString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#aaa\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
            mb.window.webContents.executeJavaScript('document.getElementById("history").innerHTML = "' + recentlyVisitedString + '"')
        })
    })
}

async function getMoreRecentlyVisited() {
    recentlyVisitedString = ''
    let moreRecentlyVisitedTitlesArray = []
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
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<input id=\\"recentSearch\\" type=\\"text\\" onkeyup=\\"searchRecent(this)\\" placeholder=\\"Search...\\" />"')
            let previousDate = new Date(item[0].utc_time).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })
            if (previousDate == new Date(Date.now()).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })) {
                recentlyVisitedString += '<div class=\\"date\\">Today</div>'
            } else {
                recentlyVisitedString += '<div class=\\"date\\">' + previousDate + '</div>'
            }
            recentlyVisitedString += '<ul class=\\"list-container history-list-container\\">'
            for (let j = 0; j < item.length; j++) {
                if (item[j].title && item[j].url.indexOf('https://gitlab.com/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !moreRecentlyVisitedTitlesArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New merge request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ') {
                    let nameWithNamespace = item[j].url.replace('https://gitlab.com/', '').split('/-/')[0]
                    if (nameWithNamespace.split('/')[0] != 'groups') {
                        url = 'https://gitlab.com/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
                    } else {
                        url = 'https://gitlab.com/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
                    }
                    let currentDate = new Date(item[j].utc_time).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })
                    if (previousDate != currentDate) {
                        recentlyVisitedString += '</ul><div class=\\"date\\">' + currentDate + '</div><ul class=\\"list-container\\">'
                    }
                    previousDate = currentDate
                    moreRecentlyVisitedArray.push(item[j])
                    moreRecentlyVisitedTitlesArray.push(item[j].title)
                    recentlyVisitedString += '<li class=\\"history-entry\\">'
                    recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item[j].utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item[j].url.split('/-/')[0] + '\\" target=\\"_blank\\">' + item[j].title.split('·')[2].trim() + '</a></span></div></li>'
                }
            }
            recentlyVisitedString += '</ul>'
            mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + recentlyVisitedString + '"')
        })
    })
}

function searchRecentlyVisited(searchterm) {
    let foundArray = moreRecentlyVisitedArray.filter(item => {
        return item.title.toLowerCase().includes(searchterm)
    })
    foundString = '<ul class=\\"list-container\\">'
    for (let item of foundArray) {
        let nameWithNamespace = item.url.replace('https://gitlab.com/', '').split('/-/')[0]
        if (nameWithNamespace.split('/')[0] != 'groups') {
            url = 'https://gitlab.com/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
        } else {
            url = 'https://gitlab.com/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
        }
        foundString += '<li class=\\"history-entry\\">'
        foundString += '<a href=\\"' + item.url + '\\" target=\\"_blank\\">' + escapeHtml(item.title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item.utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item.url.split('/-/')[0] + '\\" target=\\"_blank\\">' + item.title.split('·')[2].trim() + '</a></span></div></li>'
    }
    foundString += '</ul>'
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + foundString + '"')
}

function getUsersProjects() {
    fetch('https://gitlab.com/api/v4/users/' + user_id + '/starred_projects?min_access_level=30&per_page=' + numberOfFavoriteProjects + '&order_by=updated_at&access_token=' + access_token).then(result => {
        return result.json()
    }).then(projects => {
        let favoriteProjectsString = ''
        let chevron = '<svg class=\\"chevron\\" xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#c9d1d9\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\" /></svg>'
        for (let project of projects) {
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
            favoriteProjectsString += '<li onclick=\\"goToDetail(' + projectString + ', ' + projectJson + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\"><path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M2 13.122a1 1 0 00.741.966l7 1.876A1 1 0 0011 14.998V14h2a1 1 0 001-1V3a1 1 0 00-1-1h-2v-.994A1 1 0 009.741.04l-7 1.876A1 1 0 002 2.882v10.24zM9 2.31v11.384l-5-1.34V3.65l5-1.34zM11 12V4h1v8h-1z\\" fill=\\"#c9d1d9\\"/></svg>'
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
        for (let comment of comments) {
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
                recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
            })
        }
        let moreString = "'Comments'"
        recentCommentsString += '<li class=\\"more-link\\"><a onclick=\\"goToDetail(' + moreString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#aaa\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("comments").innerHTML = "' + recentCommentsString + '"')
    })
}

function getMoreRecentComments(url = 'https://gitlab.com/api/v4/events?action=commented&per_page=' + numberOfComments + '&access_token=' + access_token) {
    let recentCommentsString = '<ul class=\\"list-container\\">'
    let type = "'Comments'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(async comments => {
        for (let comment of comments) {
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
                recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
            })
        }
        recentCommentsString += '</ul>' + displayPagination(keysetLinks, type)
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + recentCommentsString + '"')
    })
}

function getIssues(url = 'https://gitlab.com/api/v4/issues?scope=assigned_to_me&state=opened&order_by=updated_at&per_page=' + numberOfIssues + '&access_token=' + access_token) {
    let issuesString = '<ul class=\\"list-container\\">'
    let type = "'Issues'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(issues => {
        for (let issue of issues) {
            issuesString += '<li class=\\"history-entry\\">'
            issuesString += '<a href=\\"' + issue.web_url + '\\" target=\\"_blank\\">' + escapeHtml(issue.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(issue.updated_at)) + ' ago &middot; <a href=\\"' + issue.web_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + issue.references.full.split('#')[0] + '</a></span></div></li>'
        }
        issuesString += '</ul>' + displayPagination(keysetLinks, type)
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + issuesString + '"')
    })
}

function getMRs(url = 'https://gitlab.com/api/v4/merge_requests?scope=assigned_to_me&state=opened&order_by=updated_at&per_page=' + numberOfMRs + '&access_token=' + access_token) {
    let mrsString = ''
    let type = "'MRs'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(mrs => {
        if (mrs.length > 0) {
            mrsString = '<ul class=\\"list-container\\">'
            for (let mr of mrs) {
                mrsString += '<li class=\\"history-entry\\">'
                mrsString += '<a href=\\"' + mr.web_url + '\\" target=\\"_blank\\">' + escapeHtml(mr.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(mr.updated_at)) + ' ago &middot; <a href=\\"' + mr.web_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + mr.references.full.split('!')[0] + '</a></span></div></li>'
            }
            mrsString += '</ul>' + displayPagination(keysetLinks, type)
        } else {
            mrsString = '<div class=\\"empty\\">No merge requests.</div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + mrsString + '"')
    })
}

function getTodos(url = 'https://gitlab.com/api/v4/todos?per_page=' + numberOfTodos + '&access_token=' + access_token) {
    let todosString = '<ul class=\\"list-container\\">'
    let type = "'Todos'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(todos => {
        for (let todo of todos) {
            todosString += '<li class=\\"history-entry\\">'
            let location = ''
            if (todo.project) {
                location = todo.project.name_with_namespace
            } else if (todo.group) {
                location = todo.group.name
            }
            todosString += '<a href=\\"' + todo.target_url + '\\" target=\\"_blank\\">' + escapeHtml(todo.target.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(todo.updated_at)) + ' ago &middot; <a href=\\"' + todo.target_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + location + '</a></span></div></li>'
        }
        todosString += '</ul>' + displayPagination(keysetLinks, type)
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + todosString + '"')
    })
}

function getBookmarks() {
    let bookmarks = store.get('bookmarks')
    let bookmarksString = ''
    if (bookmarks && bookmarks.length > 0) {
        bookmarksString = '<ul class=\\"list-container\\">'
        bookmarks.forEach(bookmark => {
            let namespace = ''
            if (bookmark.namespace) {
                namespace = '<a href=\\"' + bookmark.locationUrl + '\\" target=\\"_blank\\">' + bookmark.namespace + ' / ' + bookmark.project + '</a>'
            } else {
                namespace = '<a href=\\"' + bookmark.locationUrl + '\\" target=\\"_blank\\">' + bookmark.project + '</a>'
            }
            let bookmarkUrl = "'" + bookmark.url + "'"
            bookmarksString += '<li class=\\"history-entry bookmark-entry\\"><div class=\\"bookmark-information\\"><a href=\\"' + bookmark.url + '\\" target=\\"_blank\\">' + bookmark.title + '</a><span class=\\"namespace-with-time\\">Added ' + timeSince(bookmark.added) + ' ago &middot; ' + namespace + '</span></div><div class=\\"bookmark-delete-wrapper\\"><div class=\\"bookmark-delete\\" onclick=\\"deleteBookmark(' + bookmarkUrl + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#c9d1d9\\" d=\\"M14,3 C14.5522847,3 15,3.44771525 15,4 C15,4.55228475 14.5522847,5 14,5 L13.846,5 L13.1420511,14.1534404 C13.0618518,15.1954311 12.1930072,16 11.1479,16 L4.85206,16 C3.80698826,16 2.93809469,15.1953857 2.8579545,14.1533833 L2.154,5 L2,5 C1.44771525,5 1,4.55228475 1,4 C1,3.44771525 1.44771525,3 2,3 L5,3 L5,2 C5,0.945642739 5.81588212,0.0818352903 6.85073825,0.00548576453 L7,0 L9,0 C10.0543573,0 10.9181647,0.815882118 10.9945142,1.85073825 L11,2 L11,3 L14,3 Z M11.84,5 L4.159,5 L4.85206449,14.0000111 L11.1479,14.0000111 L11.84,5 Z M9,2 L7,2 L7,3 L9,3 L9,2 Z\\"/></svg></div></div></li>'
        })
        bookmarksString += '<li id=\\"add-bookmark-dialog\\" class=\\"more-link\\"><a onclick=\\"startBookmarkDialog()\\">Add another bookmark <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#aaa\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("bookmarks").innerHTML = "' + bookmarksString + '"')
    } else {
        let bookmarkLink = "'bookmark-link'"
        bookmarksString = '<div id=\\"new-bookmark\\"><div><span id=\\"cta\\">Add a new GitLab bookmark</span> 🔖</div><div id=\\"cta-description\\">Bookmarks are helpful when you have an issue/merge request you will have to come back to repeatedly.</div><form id=\\"bookmark-input\\" action=\\"#\\" onsubmit=\\"addBookmark(document.getElementById(' + bookmarkLink + ').value);return false;\\"><input id=\\"bookmark-link\\" placeholder=\\"Enter your link here...\\" /><button id=\\"bookmark-add-button\\" type=\\"submit\\">Add</button></form></div>'
        mb.window.webContents.executeJavaScript('document.getElementById("bookmarks").innerHTML = "' + bookmarksString + '"')
    }
}

function displayPagination(keysetLinks, type) {
    let paginationString = ''
    if (keysetLinks.indexOf('rel="next"') != -1 || keysetLinks.indexOf('rel="prev"') != -1) {
        paginationString += '<div id=\\"pagination\\">'
        if (keysetLinks.indexOf('rel="prev"') != -1) {
            let prevLink = ''
            let icon = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#c9d1d9\\" fill-rule=\\"evenodd\\" d=\\"M10.707085,3.70711 C11.097605,3.31658 11.097605,2.68342 10.707085,2.29289 C10.316555,1.90237 9.683395,1.90237 9.292865,2.29289 L4.292875,7.29289 C3.902375,7.68342 3.902375,8.31658 4.292875,8.70711 L9.292865,13.7071 C9.683395,14.0976 10.316555,14.0976 10.707085,13.7071 C11.097605,13.3166 11.097605,12.6834 10.707085,12.2929 L6.414185,8 L10.707085,3.70711 Z\\"/></svg>'
            prevLink = escapeHtml('"' + keysetLinks.split('>; rel="prev"')[0].substring(1) + '"')
            paginationString += '<button onclick=\\"switchPage(' + prevLink + ', ' + type + ')\\" class=\\"prev\\">' + icon + ' Previous</button>'
        } else {
            paginationString += '<div></div>'
        }
        if (keysetLinks.indexOf('rel="next"') != -1) {
            let nextLink = ''
            let icon = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill=\\"#c9d1d9\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\"/></svg>'
            if (keysetLinks.indexOf('rel="prev"') != -1) {
                nextLink = escapeHtml('"' + keysetLinks.split('rel="prev", ')[1].split('>; rel="next"')[0].substring(1) + '"')
                paginationString += '<button onclick=\\"switchPage(' + nextLink + ', ' + type + ')\\" class=\\"next\\">Next ' + icon + '</button>'
            } else {
                nextLink = escapeHtml('"' + keysetLinks.split('>; rel="next"')[0].substring(1) + '"')
                paginationString += '<button onclick=\\"switchPage(' + nextLink + ', ' + type + ')\\" class=\\"next\\">Next ' + icon + '</button>'
            }
        } else {
            paginationString += '<div></div>'
        }
        paginationString += '</div>'
        return paginationString
    } else {
        return ''
    }
}

function displayProjectPage(project) {
    let logo
    if (project.avatar_url && project.avatar_url != null && project.visibility == 'public') {
        logo = '<img id=\\"project-detail-avatar\\" src=\\"' + project.avatar_url + '?width=64\\" />'
    } else {
        logo = '<div id=\\"project-detail-name-avatar\\">' + project.name.charAt(0).toUpperCase() + '</div>'
    }
    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<div id=\\"project-detail-information\\">' + logo + '<div><span class=\\"project-namespace\\">' + project.namespace.name + '</span><span class=\\"project-name\\">' + project.name + '</span></div></div>"')
}

function displayCommit(commit, project) {
    let logo = ''
    if (commit.last_pipeline) {
        if (commit.last_pipeline.status == 'scheduled') {
            logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"7\\"/><circle fill=\\"#c9d1d9\\" style=\\"fill: var(--svg-status-bg, #c9d1d9);\\" cx=\\"7\\" cy=\\"7\\" r=\\"6\\"/><g transform=\\"translate(2.75 2.75)\\" fill-rule=\\"nonzero\\"><path d=\\"M4.165 7.81a3.644 3.644 0 1 1 0-7.29 3.644 3.644 0 0 1 0 7.29zm0-1.042a2.603 2.603 0 1 0 0-5.206 2.603 2.603 0 0 0 0 5.206z\\"/><rect x=\\"3.644\\" y=\\"2.083\\" width=\\"1.041\\" height=\\"2.603\\" rx=\\".488\\"/><rect x=\\"3.644\\" y=\\"3.644\\" width=\\"2.083\\" height=\\"1.041\\" rx=\\".488\\"/></g></svg>'
        } else {
            logo = '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\" fill=\\"#c9d1d9\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" fill=\\"#090c10\\"/>'
            if (commit.last_pipeline.status == 'running') {
                logo += '<path d=\\"M7 3c2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.3 0-2.5-.7-3.3-1.7L7 7V3\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'failed') {
                logo += '<path d=\\"M7 5.969L5.599 4.568a.29.29 0 0 0-.413.004l-.614.614a.294.294 0 0 0-.004.413L5.968 7l-1.4 1.401a.29.29 0 0 0 .004.413l.614.614c.113.114.3.117.413.004L7 8.032l1.401 1.4a.29.29 0 0 0 .413-.004l.614-.614a.294.294 0 0 0 .004-.413L8.032 7l1.4-1.401a.29.29 0 0 0-.004-.413l-.614-.614a.294.294 0 0 0-.413-.004L7 5.968z\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'success') {
                logo += '<path d=\\"M6.278 7.697L5.045 6.464a.296.296 0 0 0-.42-.002l-.613.614a.298.298 0 0 0 .002.42l1.91 1.909a.5.5 0 0 0 .703.005l.265-.265L9.997 6.04a.291.291 0 0 0-.009-.408l-.614-.614a.29.29 0 0 0-.408-.009L6.278 7.697z\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'pending') {
                logo += '<path d=\\"M4.7 5.3c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H5c-.2 0-.3-.1-.3-.3V5.3m3 0c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H8c-.2 0-.3-.1-.3-.3V5.3\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'canceled') {
                logo += '<path d=\\"M5.2 3.8l4.9 4.9c.2.2.2.5 0 .7l-.7.7c-.2.2-.5.2-.7 0L3.8 5.2c-.2-.2-.2-.5 0-.7l.7-.7c.2-.2.5-.2.7 0\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'skipped') {
                logo += '<path d=\\"M6.415 7.04L4.579 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L5.341 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L6.415 7.04zm2.54 0L7.119 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L7.881 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L8.955 7.04z\\" fill=\\"#c9d1d9\\"/></svg>'
            } else if (commit.last_pipeline.status == 'created') {
                logo += '<circle cx=\\"7\\" cy=\\"7\\" r=\\"3.25\\" fill=\\"#c9d1d9\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'preparing') {
                logo += '</g><circle cx=\\"7\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"10\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"4\\" cy=\\"7\\" r=\\"1\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'manual') {
                logo += '<path d=\\"M10.5 7.63V6.37l-.787-.13c-.044-.175-.132-.349-.263-.61l.481-.652-.918-.913-.657.478a2.346 2.346 0 0 0-.612-.26L7.656 3.5H6.388l-.132.783c-.219.043-.394.13-.612.26l-.657-.478-.918.913.437.652c-.131.218-.175.392-.262.61l-.744.086v1.261l.787.13c.044.218.132.392.263.61l-.438.651.92.913.655-.434c.175.086.394.173.613.26l.131.783h1.313l.131-.783c.219-.043.394-.13.613-.26l.656.478.918-.913-.48-.652c.13-.218.218-.435.262-.61l.656-.13zM7 8.283a1.285 1.285 0 0 1-1.313-1.305c0-.739.57-1.304 1.313-1.304.744 0 1.313.565 1.313 1.304 0 .74-.57 1.305-1.313 1.305z\\" fill=\\"#c9d1d9\\"/></g></svg>'
            }
        }
    } else {
        if (project.avatar_url && project.avatar_url != null && project.visibility == 'public') {
            logo = '<img src=\\"' + project.avatar_url + '?width=64\\" />'
        } else {
            logo = '<div id=\\"project-name\\">' + project.name.charAt(0).toUpperCase() + '</div>'
        }
        //TODO When https://gitlab.com/gitlab-org/gitlab/-/issues/20924 is fixed, get users avatar here
        /*await fetch('https://gitlab.com/api/v4/users?search=' + commit.author_email + '&access_token=' + access_token).then(result => {
            return result.json()
        }).then(user => {
            console.log(user[0])
            logo = '<img src=\\"' + user[0].avatar_url + '\\" />'
        })*/
    }
    return '<div class=\\"commit\\">' + logo + '<div class=\\"commit-information\\"><a href=\\"' + commit.web_url + '\\" target=\\"_blank\\">' + commit.title + '</a><div><span class=\\"namespace-with-time\\">' + timeSince(new Date(commit.committed_date.split('.')[0] + 'Z')) + ' ago &middot; <a href=\\"' + project.web_url + '\\" target=\\_blank\\">' + project.name_with_namespace + '</a></span></div></div></div>'
}

function addBookmark(link) {
    let spinner = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 14 14\\"><g fill=\\"none\\" fill-rule=\\"evenodd\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"6\\" stroke=\\"#c9d1d9\\" stroke-opacity=\\".4\\" stroke-width=\\"2\\"/><path fill=\\"#c9d1d9\\" fill-opacity=\\".4\\" fill-rule=\\"nonzero\\" d=\\"M7 0a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V0z\\"/></g></svg>'
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-add-button").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-link").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-add-button").innerHTML = "' + spinner + ' Add"')
    if (link.indexOf('https://gitlab.com') == 0 || link.indexOf('gitlab.com') == 0 || link.indexOf('http://gitlab.com') == 0) {
        parseGitLabUrl(link).then(bookmark => {
            let bookmarks = store.get('bookmarks') || []
            bookmarks.push(bookmark)
            store.set('bookmarks', bookmarks)
            getBookmarks()
        })
    }
}

function startBookmarkDialog() {
    let bookmarkLink = "'bookmark-link'"
    let bookmarkInput = '<form action=\\"#\\" id=\\"bookmark-input\\" onsubmit=\\"addBookmark(document.getElementById(' + bookmarkLink + ').value);return false;\\"><input id=\\"bookmark-link\\" placeholder=\\"Enter your link here...\\" /><button id=\\"bookmark-add-button\\" type=\\"submit\\">Add</button></form>'
    mb.window.webContents.executeJavaScript('document.getElementById("add-bookmark-dialog").classList.add("opened")')
    mb.window.webContents.executeJavaScript('document.getElementById("add-bookmark-dialog").innerHTML = "' + bookmarkInput + '"')
    mb.window.webContents.executeJavaScript('window.scrollBy(0, 14)')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-link").focus()')
}

async function parseGitLabUrl(link) {
    let object = parse(link)
    let issuable
    if (object.type == 'issues' || object.type == 'merge_requests') {
        let result = await fetch('https://gitlab.com/api/v4/projects/' + encodeURIComponent(object.namespace + '/' + object.project) + '/' + object.type + '/' + object[object.type] + '?access_token=' + access_token)
        issuable = await result.json()
        let result2 = await fetch('https://gitlab.com/api/v4/projects/' + issuable.project_id + '?access_token=' + access_token)
        let project = await result2.json()
        return {
            url: link,
            namespace: project.namespace.name,
            project: project.name,
            title: issuable.title,
            added: Date.now(),
            type: object.type,
            locationUrl: project.web_url
        }
    } else if (object.type == 'epics') {
        let result = await fetch('https://gitlab.com/api/v4/groups/' + encodeURIComponent(object.project) + '/' + object.type + '/' + object[object.type])
        issuable = await result.json()
        let result2 = await fetch('https://gitlab.com/api/v4/groups/' + issuable.group_id + '?access_token=' + access_token)
        let group = await result2.json()
        return {
            url: link,
            project: group.name,
            title: issuable.title,
            added: Date.now(),
            type: object.type,
            locationUrl: group.web_url
        }
    }
}

function parse(gitlabUrl) {
    if (typeof gitlabUrl !== 'string') {
        throw new Error('Expected gitLabUrl of type string')
    }
    const url = new URL(gitlabUrl)
    const path = url.pathname
    const [, namespace, project, deliminator, type, ...rest] = path.split('/')
    let result = { namespace, project, type }
    const typeParser = typeParsers[type]
    if (typeParser) {
        result = { ...result, ...typeParser(rest.shift()) }
    }
    return result
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
