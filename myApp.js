const { menubar } = require('menubar')
const { Menu, Notification, shell, ipcMain, app } = require("electron")
const { allLabel, allText, approvalLabel, approvalText, approvedLabel, approvedText, assignedLabel, assignedText, closedLabel, closedText, createdLabel, createdText, dueDateLabel, dueDateText, mergedLabel, mergedText, openedLabel, openedText, query, recentlyCreatedLabel, recentlyCreatedText, recentlyUpdatedLabel, recentlyUpdatedText, reviewedLabel, reviewedText, sort, state } = require('./src/filter-text')
const fetch = require('node-fetch');
const Store = require('electron-store');
const store = new Store()
const BrowserHistory = require('./lib/browser-history');
const { URL } = require('url');
const ua = require('universal-analytics');
const uuid = require('uuid/v4');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let access_token = store.get('access_token')
let user_id = store.get('user_id')
let username = store.get('username')
let host = store.get('host') || 'https://gitlab.com'
let plan = store.get('plan') || 'free'
let analytics = store.get('analytics') || false
let analytics_id = store.get('analytics_id') || uuid();
store.set('analytics_id', analytics_id)
let visitor
if (analytics) {
    visitor = ua('UA-203420427-1', analytics_id);
}
let recentlyVisitedString = ''
let currentProject
let moreRecentlyVisitedArray = []
let recentCommits = []
let currentCommit
let lastEventId
let lastTodoId = -1
let recentProjectCommits = []
let currentProjectCommit
let numberOfRecentlyVisited = 3
let numberOfFavoriteProjects = 5
let numberOfRecentComments = 3
let numberOfIssues = 10
let numberOfMRs = 10
let numberOfTodos = 10
let numberOfComments = 5
let activeIssuesQueryOption = 'assigned_to_me'
let activeIssuesStateOption = 'opened'
let activeIssuesSortOption = 'created_at'
let activeMRsQueryOption = 'assigned_to_me'
let activeMRsStateOption = 'opened'
let activeMRsSortOption = 'created_at'
let runningPipelineSubscriptions = []
let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
let isOnSubPage = false

//Anti rebound variables
let delay = 2000
let lastUserExecution = 0
let lastRecentlyVisitedExecution = 0
let lastLastCommitsExecution = 0
let lastRecentCommentsExecution = 0

let lastUserExecutionFinished = true
let lastRecentlyVisitedExecutionFinished = true
let lastLastCommitsExecutionFinished = true
let lastRecentCommentsExecutionFinished = true

const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlabTemplate.png',
    preloadWindow: true,
    browserWindow: {
        width: 550,
        height: 700,
        minWidth: 265,
        minHeight: 300,
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        }
    }
});

ipcMain.on('detail-page', (event, arg) => {
    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = ""')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
    if (arg.page == 'Project') {
        if (analytics) {
            visitor.pageview("/project").send()
        }
        mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<div id=\\"project-commits-pagination\\"><span class=\\"name\\">Commits</span><div id=\\"commits-pagination\\"><span id=\\"commits-count\\" class=\\"empty\\"></span><button onclick=\\"changeCommit(false)\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M10.707085,3.70711 C11.097605,3.31658 11.097605,2.68342 10.707085,2.29289 C10.316555,1.90237 9.683395,1.90237 9.292865,2.29289 L4.292875,7.29289 C3.902375,7.68342 3.902375,8.31658 4.292875,8.70711 L9.292865,13.7071 C9.683395,14.0976 10.316555,14.0976 10.707085,13.7071 C11.097605,13.3166 11.097605,12.6834 10.707085,12.2929 L6.414185,8 L10.707085,3.70711 Z\\" /></svg></button><button onclick=\\"changeCommit(true)\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\" /></svg></button></div></div>"')
        setupEmptyProjectPage()
        let project = JSON.parse(arg.object)
        currentProject = project
        displayProjectPage(project)
        getProjectCommits(project)
        getProjectIssues(project)
        getProjectMRs(project)
    } else {
        mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").classList.remove("empty")')
        mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").innerHTML = "' + arg.page + '"')
        if (arg.page == 'Issues') {
            if (analytics) {
                visitor.pageview("/my-issues").send()
            }
            let issuesQuerySelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"issues-query-active\\">Assigned</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-query-select\\" type=\\"radio\\" id=\\"' + assignedLabel + '\\" onchange=\\"switchIssues(' + assignedLabel + ', ' + query + ', ' + assignedText + ')\\" checked><label for=\\"' + assignedLabel + '\\" class=\\"custom-option-label\\">Assigned</label><input class=\\"custom-option\\" name=\\"issues-query-select\\" type=\\"radio\\" id=\\"' + createdLabel + '\\" onchange=\\"switchIssues(' + createdLabel + ', ' + query + ', ' + createdText + ')\\"><label for=\\"' + createdLabel + '\\" class=\\"custom-option-label\\">Created</label></div></div>'
            let issuesStateSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"issues-state-active\\">Open</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + allLabel + '\\" onchange=\\"switchIssues(' + allLabel + ', ' + state + ', ' + allText + ')\\"><label for=\\"' + allLabel + '\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + openedLabel + '\\" onchange=\\"switchIssues(' + openedLabel + ', ' + state + ', ' + openedText + ')\\" checked><label for=\\"' + openedLabel + '\\" class=\\"custom-option-label\\">Open</label><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + closedLabel + '\\" onchange=\\"switchIssues(' + closedLabel + ', ' + state + ', ' + closedText + ')\\"><label for=\\"' + closedLabel + '\\" class=\\"custom-option-label\\">Closed</label></div></div>'
            let issuesSortSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"issues-sort-active\\">Sort by recently created</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + recentlyCreatedLabel + '\\" onchange=\\"switchIssues(' + recentlyCreatedLabel + ', ' + sort + ', ' + recentlyCreatedText + ')\\" checked><label for=\\"' + recentlyCreatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently created</label><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + recentlyUpdatedLabel + '\\" onchange=\\"switchIssues(' + recentlyUpdatedLabel + ', ' + sort + ', ' + recentlyUpdatedText + ')\\"><label for=\\"' + recentlyUpdatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently updated</label><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + dueDateLabel + '\\" onchange=\\"switchIssues(' + dueDateLabel + ', ' + sort + ', ' + dueDateText + ')\\"><label for=\\"' + dueDateLabel + '\\" class=\\"custom-option-label\\">Sort by due date</label></div></div>'
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"filter-sort\\">' + issuesQuerySelect + issuesStateSelect + issuesSortSelect + '</div>"')
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").classList.add("with-overflow")')
            displaySkeleton(numberOfIssues)
            getIssues()
        } else if (arg.page == 'Merge requests') {
            if (analytics) {
                visitor.pageview("/my-merge-requests").send()
            }
            let mrsQuerySelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"mrs-query-active\\">Assigned</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + assignedLabel + '\\" onchange=\\"switchMRs(' + assignedLabel + ', ' + query + ', ' + assignedText + ')\\" checked><label for=\\"' + assignedLabel + '\\" class=\\"custom-option-label\\">Assigned</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + createdLabel + '\\" onchange=\\"switchMRs(' + createdLabel + ', ' + query + ', ' + createdText + ')\\"><label for=\\"' + createdLabel + '\\" class=\\"custom-option-label\\">Created</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + reviewedLabel + '\\" onchange=\\"switchMRs(' + reviewedLabel + ', ' + query + ', ' + reviewedText + ')\\"><label for=\\"' + reviewedLabel + '\\" class=\\"custom-option-label\\">Review requests</label>'
            if (plan != 'free') {
                mrsQuerySelect += '<input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + approvedLabel + '\\" onchange=\\"switchMRs(' + approvedLabel + ', ' + query + ', ' + approvedText + ')\\"><label for=\\"' + approvedLabel + '\\" class=\\"custom-option-label\\">Approved</label>'
            }
            mrsQuerySelect += '<input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + approvalLabel + '\\" onchange=\\"switchMRs(' + approvalLabel + ', ' + query + ', ' + approvalText + ')\\"><label for=\\"' + approvalLabel + '\\" class=\\"custom-option-label\\">Approval rule</label></div></div>'
            let mrsStateSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"mrs-state-active\\">Open</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + allLabel + '\\" onchange=\\"switchMRs(' + allLabel + ', ' + state + ', ' + allText + ')\\"><label for=\\"' + allLabel + '\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + openedLabel + '\\" onchange=\\"switchMRs(' + openedLabel + ', ' + state + ', ' + openedText + ')\\" checked><label for=\\"' + openedLabel + '\\" class=\\"custom-option-label\\">Open</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + mergedLabel + '\\" onchange=\\"switchMRs(' + mergedLabel + ', ' + state + ', ' + mergedText + ')\\"><label for=\\"' + mergedLabel + '\\" class=\\"custom-option-label\\">Merged</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + closedLabel + '\\" onchange=\\"switchMRs(' + closedLabel + ', ' + state + ', ' + closedText + ')\\"><label for=\\"' + closedLabel + '\\" class=\\"custom-option-label\\">Closed</label></div></div>'
            let mrsSortSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"mrs-sort-active\\">Sort by recently created</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-sort-select\\" type=\\"radio\\" id=\\"' + recentlyCreatedLabel + '\\" onchange=\\"switchMRs(' + recentlyCreatedLabel + ', ' + sort + ', ' + recentlyCreatedText + ')\\" checked><label for=\\"' + recentlyCreatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently created</label><input class=\\"custom-option\\" name=\\"mrs-sort-select\\" type=\\"radio\\" id=\\"' + recentlyUpdatedLabel + '\\" onchange=\\"switchMRs(' + recentlyUpdatedLabel + ', ' + sort + ', ' + recentlyUpdatedText + ')\\"><label for=\\"' + recentlyUpdatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently updated</label></div></div>'
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"filter-sort\\">' + mrsQuerySelect + mrsStateSelect + mrsSortSelect + '</div>"')
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").classList.add("with-overflow")')
            displaySkeleton(numberOfMRs)
            getMRs()
        } else if (arg.page == 'To-Do list') {
            if (analytics) {
                visitor.pageview("/my-to-do-list").send()
            }
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span>"')
            mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").innerHTML = "' + arg.page + '<div class=\\"detail-external-link\\"><a href=\\"' + host + '/dashboard/todos\\" target=\\"_blank\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path fill-rule=\\"evenodd\\" d=\\"M5,2 C5.55228,2 6,2.44772 6,3 C6,3.55228 5.55228,4 5,4 L4,4 L4,12 L12,12 L12,11 C12,10.4477 12.4477,10 13,10 C13.5523,10 14,10.4477 14,11 L14,12 C14,13.1046 13.1046,14 12,14 L4,14 C2.89543,14 2,13.1046 2,12 L2,4 C2,2.89543 2.89543,2 4,2 L5,2 Z M15,1 L15,5.99814453 C15,6.55043453 14.5523,6.99814453 14,6.99814453 C13.4477,6.99814453 13,6.55043453 13,5.99814453 L13,4.41419 L8.71571,8.69846 C8.32519,9.08899 7.69202,9.08899 7.3015,8.69846 C6.91097,8.30794 6.91097,7.67477 7.3015,7.28425 L11.5858,3 L9.99619141,3 C9.44391141,3 8.99619141,2.55228 8.99619141,2 C8.99619141,1.44772 9.44391141,1 9.99619141,1 L15,1 Z\\"/></svg></a></div>"')
            displaySkeleton(numberOfTodos)
            getTodos()
        } else if (arg.page == 'Recently viewed') {
            if (analytics) {
                visitor.pageview("/my-history").send()
            }
            displaySkeleton(numberOfRecentlyVisited)
            getMoreRecentlyVisited()
        } else if (arg.page == 'Comments') {
            if (analytics) {
                visitor.pageview("/my-comments").send()
            }
            mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span>"')
            displaySkeleton(numberOfComments)
            getMoreRecentComments()
        }
    }
})

ipcMain.on('sub-detail-page', (event, arg) => {
    isOnSubPage = true
    activeIssuesQueryOption = 'all'
    activeMRsQueryOption = 'all'
    let activeState = 'Open'
    let allChecked = ''
    let openChecked = ' checked'
    let allChanged = ''
    let project = JSON.parse(arg.project)
    mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-headline").innerHTML = ""')
    mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-content").innerHTML = ""')
    mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-header-content").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-header-content").innerHTML = "' + arg.page + '"')
    if (arg.page == 'Issues') {
        if (analytics) {
            visitor.pageview("/project/issues").send()
        }
        if (arg.all == true) {
            activeIssuesStateOption = 'all'
            activeState = 'All'
            allChecked = ' checked'
            openChecked = ''
            allChanged = ' changed'
        }
        let issuesQuerySelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"issues-query-active\\">All</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-query-select\\" type=\\"radio\\" id=\\"' + allLabel + '\\" onchange=\\"switchIssues(' + allLabel + ', ' + query + ', ' + allText + ')\\" checked><label for=\\"' + allLabel + '\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"issues-query-select\\" type=\\"radio\\" id=\\"' + assignedLabel + '\\" onchange=\\"switchIssues(' + assignedLabel + ', ' + query + ', ' + assignedText + ')\\"><label for=\\"' + assignedLabel + '\\" class=\\"custom-option-label\\">Assigned</label><input class=\\"custom-option\\" name=\\"issues-query-select\\" type=\\"radio\\" id=\\"' + createdLabel + '\\" onchange=\\"switchIssues(' + createdLabel + ', ' + query + ', ' + createdText + ')\\"><label for=\\"' + createdLabel + '\\" class=\\"custom-option-label\\">Created</label></div></div>'
        let issuesStateSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active' + allChanged + '\\" id=\\"issues-state-active\\">' + activeState + '</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + allLabel + '-issues\\" onchange=\\"switchIssues(' + allLabel + ', ' + state + ', ' + allText + ')\\"' + allChecked + '><label for=\\"' + allLabel + '-issues\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + openedLabel + '\\" onchange=\\"switchIssues(' + openedLabel + ', ' + state + ', ' + openedText + ')\\"' + openChecked + '><label for=\\"' + openedLabel + '\\" class=\\"custom-option-label\\">Open</label><input class=\\"custom-option\\" name=\\"issues-state-select\\" type=\\"radio\\" id=\\"' + closedLabel + '\\" onchange=\\"switchIssues(' + closedLabel + ', ' + state + ', ' + closedText + ')\\"><label for=\\"' + closedLabel + '\\" class=\\"custom-option-label\\">Closed</label></div></div>'
        let issuesSortSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"issues-sort-active\\">Sort by recently created</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + recentlyCreatedLabel + '\\" onchange=\\"switchIssues(' + recentlyCreatedLabel + ', ' + sort + ', ' + recentlyCreatedText + ')\\" checked><label for=\\"' + recentlyCreatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently created</label><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + recentlyUpdatedLabel + '\\" onchange=\\"switchIssues(' + recentlyUpdatedLabel + ', ' + sort + ', ' + recentlyUpdatedText + ')\\"><label for=\\"' + recentlyUpdatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently updated</label><input class=\\"custom-option\\" name=\\"issues-sort-select\\" type=\\"radio\\" id=\\"' + dueDateLabel + '\\" onchange=\\"switchIssues(' + dueDateLabel + ', ' + sort + ', ' + dueDateText + ')\\"><label for=\\"' + dueDateLabel + '\\" class=\\"custom-option-label\\">Sort by due date</label></div></div>'
        mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"filter-sort\\">' + issuesQuerySelect + issuesStateSelect + issuesSortSelect + '</div>"')
        mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-headline").classList.add("with-overflow")')
        displaySkeleton(numberOfIssues, undefined, 'sub-detail-content')
        getIssues(host + '/api/v4/projects/' + project.id + '/issues?scope=all&state=' + activeIssuesStateOption + '&order_by=created_at&per_page=' + numberOfIssues + '&access_token=' + access_token, 'sub-detail-content')
    } else if (arg.page == 'Merge Requests') {
        if (analytics) {
            visitor.pageview("/project/merge-requests").send()
        }
        if (arg.all == true) {
            activeMRsStateOption = 'all'
            activeState = 'All'
            allChecked = ' checked'
            openChecked = ''
            allChanged = ' changed'
        }
        let mrsQuerySelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"mrs-query-active\\">All</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + allLabel + '\\" onchange=\\"switchMRs(' + allLabel + ', ' + query + ', ' + allText + ')\\" checked><label for=\\"' + allLabel + '\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + assignedLabel + '\\" onchange=\\"switchMRs(' + assignedLabel + ', ' + query + ', ' + assignedText + ')\\"><label for=\\"' + assignedLabel + '\\" class=\\"custom-option-label\\">Assigned</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + createdLabel + '\\" onchange=\\"switchMRs(' + createdLabel + ', ' + query + ', ' + createdText + ')\\"><label for=\\"' + createdLabel + '\\" class=\\"custom-option-label\\">Created</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + reviewedLabel + '\\" onchange=\\"switchMRs(' + reviewedLabel + ', ' + query + ', ' + reviewedText + ')\\"><label for=\\"' + reviewedLabel + '\\" class=\\"custom-option-label\\">Review requests</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + approvedLabel + '\\" onchange=\\"switchMRs(' + approvedLabel + ', ' + query + ', ' + approvedText + ')\\"><label for=\\"' + approvedLabel + '\\" class=\\"custom-option-label\\">Approved</label><input class=\\"custom-option\\" name=\\"mrs-query-select\\" type=\\"radio\\" id=\\"' + approvalLabel + '\\" onchange=\\"switchMRs(' + approvalLabel + ', ' + query + ', ' + approvalText + ')\\"><label for=\\"' + approvalLabel + '\\" class=\\"custom-option-label\\">Approval rule</label></div></div>'
        let mrsStateSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active' + allChanged + '\\" id=\\"mrs-state-active\\">' + activeState + '</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + allLabel + '-state\\" onchange=\\"switchMRs(' + allLabel + ', ' + state + ', ' + allText + ')\\"' + allChecked + '><label for=\\"' + allLabel + '-state\\" class=\\"custom-option-label\\">All</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + openedLabel + '\\" onchange=\\"switchMRs(' + openedLabel + ', ' + state + ', ' + openedText + ')\\"' + openChecked + '><label for=\\"' + openedLabel + '\\" class=\\"custom-option-label\\">Open</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + mergedLabel + '\\" onchange=\\"switchMRs(' + mergedLabel + ', ' + state + ', ' + mergedText + ')\\"><label for=\\"' + mergedLabel + '\\" class=\\"custom-option-label\\">Merged</label><input class=\\"custom-option\\" name=\\"mrs-state-select\\" type=\\"radio\\" id=\\"' + closedLabel + '\\" onchange=\\"switchMRs(' + closedLabel + ', ' + state + ', ' + closedText + ')\\"><label for=\\"' + closedLabel + '\\" class=\\"custom-option-label\\">Closed</label></div></div>'
        let mrsSortSelect = '<div class=\\"custom-select\\" tabindex=\\"1\\"><div class=\\"custom-select-active\\" id=\\"mrs-sort-active\\">Sort by recently created</div><div class=\\"custom-options-wrapper\\"><input class=\\"custom-option\\" name=\\"mrs-sort-select\\" type=\\"radio\\" id=\\"' + recentlyCreatedLabel + '\\" onchange=\\"switchMRs(' + recentlyCreatedLabel + ', ' + sort + ', ' + recentlyCreatedText + ')\\"><label for=\\"' + recentlyCreatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently created</label><input class=\\"custom-option\\" name=\\"mrs-sort-select\\" type=\\"radio\\" id=\\"' + recentlyUpdatedLabel + '\\" onchange=\\"switchMRs(' + recentlyUpdatedLabel + ', ' + sort + ', ' + recentlyUpdatedText + ')\\" checked><label for=\\"' + recentlyUpdatedLabel + '\\" class=\\"custom-option-label\\">Sort by recently updated</label></div></div>'
        mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-headline").innerHTML = "<span class=\\"name\\">' + arg.page + '</span><div class=\\"filter-sort\\">' + mrsQuerySelect + mrsStateSelect + mrsSortSelect + '</div>"')
        mb.window.webContents.executeJavaScript('document.getElementById("sub-detail-headline").classList.add("with-overflow")')
        displaySkeleton(numberOfMRs, undefined, 'sub-detail-content')
        getMRs(host + '/api/v4/projects/' + project.id + '/merge_requests?scope=all&state=' + activeMRsStateOption + '&order_by=created_at&per_page=' + numberOfMRs + '&access_token=' + access_token, 'sub-detail-content')
    }
})

ipcMain.on('back-to-detail-page', (event, arg) => {
    isOnSubPage = false
    activeIssuesQueryOption = 'assigned_to_me'
    activeMRsQueryOption = 'assigned_to_me'
})

ipcMain.on('go-to-overview', (event, arg) => {
    if (analytics) {
        visitor.pageview("/").send()
    }
    getRecentlyVisited()
    getRecentComments()
    displayUsersProjects()
    getBookmarks()
    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").classList.remove("with-overflow")')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").classList.add("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").innerHTML = ""')
    activeIssuesQueryOption = 'assigned_to_me'
    activeIssuesStateOption = 'opened'
    activeIssuesSortOption = 'created_at'
    activeMRsQueryOption = 'assigned_to_me'
    activeMRsStateOption = 'opened'
    activeMRsSortOption = 'created_at'
    moreRecentlyVisitedArray = []
    recentProjectCommits = []
    currentProjectCommit = null
    currentProject = null
})

ipcMain.on('switch-issues', (event, arg) => {
    if (analytics) {
        visitor.event("Switch issues", arg.type, arg.label).send()
    }
    let url = host + '/api/v4/'
    let id = 'detail-content'
    if (isOnSubPage && currentProject) {
        url += 'projects/' + currentProject.id + '/'
        id = 'sub-detail-content'
    }
    if (arg.type == 'query' && arg.label != activeIssuesQueryOption) {
        activeIssuesQueryOption = arg.label
        displaySkeleton(numberOfIssues, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("issues-query-active").innerHTML = "' + arg.text + '"')
        if ((isOnSubPage == false && arg.label != 'assigned_to_me') || (isOnSubPage == true && arg.label != 'all')) {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-query-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-query-active").classList.remove("changed")')
        }
    } else if (arg.type == 'state' && arg.label != activeIssuesStateOption) {
        activeIssuesStateOption = arg.label
        displaySkeleton(numberOfIssues, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("issues-state-active").innerHTML = "' + arg.text + '"')
        if (arg.label != 'opened') {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-state-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-state-active").classList.remove("changed")')
        }
    } else if (arg.type == 'sort' && arg.label != activeIssuesSortOption) {
        activeIssuesSortOption = arg.label
        displaySkeleton(numberOfIssues, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("issues-sort-active").innerHTML = "' + arg.text + '"')
        if (arg.label != 'created_at') {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-sort-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("issues-sort-active").classList.remove("changed")')
        }
    }
    url += 'issues?scope=' + activeIssuesQueryOption + '&state=' + activeIssuesStateOption + '&order_by=' + activeIssuesSortOption + '&per_page=' + numberOfIssues + '&access_token=' + access_token
    getIssues(url, id)
})

ipcMain.on('switch-mrs', (event, arg) => {
    if (analytics) {
        visitor.event("Switch merge requests", arg.type, arg.label).send()
    }
    let url = host + '/api/v4/'
    let id = 'detail-content'
    if (isOnSubPage && currentProject) {
        url += 'projects/' + currentProject.id + '/'
        id = 'sub-detail-content'
    }
    if (arg.type == 'query' && arg.label != activeMRsQueryOption) {
        activeMRsQueryOption = arg.label
        displaySkeleton(numberOfMRs, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("mrs-query-active").innerHTML = "' + arg.text + '"')
        if (arg.label != 'all') {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-query-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-query-active").classList.remove("changed")')
        }
    } if (arg.type == 'state' && arg.label != activeMRsStateOption) {
        activeMRsStateOption = arg.label
        displaySkeleton(numberOfMRs, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("mrs-state-active").innerHTML = "' + arg.text + '"')
        if (arg.label != 'opened') {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-state-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-state-active").classList.remove("changed")')
        }
    } else if (arg.type == 'sort' && arg.label != activeMRsSortOption) {
        activeMRsSortOption = arg.label
        displaySkeleton(numberOfMRs, undefined, id)
        mb.window.webContents.executeJavaScript('document.getElementById("mrs-sort-active").innerHTML = "' + arg.text + '"')
        if (arg.label != 'created_at') {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-sort-active").classList.add("changed")')
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("mrs-sort-active").classList.remove("changed")')
        }
    }
    url += 'merge_requests?scope='
    if (activeMRsQueryOption == 'assigned_to_me' || activeMRsQueryOption == 'created_by_me') {
        url += activeMRsQueryOption
    } else if (activeMRsQueryOption == 'approved_by_me') {
        url += 'all&approved_by_ids[]=' + user_id
    } else if (activeMRsQueryOption == 'review_requests_for_me') {
        url += 'all&reviewer_id=' + user_id
    } else if (activeMRsQueryOption == 'approval_rule_for_me') {
        url += 'all&approver_ids[]=' + user_id
    }
    url += '&state=' + activeMRsStateOption + '&order_by=' + activeMRsSortOption + '&per_page=' + numberOfMRs + '&access_token=' + access_token
    getMRs(url, id)
})

ipcMain.on('switch-page', (event, arg) => {
    let id
    if (isOnSubPage) {
        id = 'sub-detail-content'
    } else {
        id = 'detail-content'
    }
    if (arg.type == 'Todos') {
        displaySkeleton(numberOfTodos, true)
        getTodos(arg.url)
    } else if (arg.type == 'Issues') {
        displaySkeleton(numberOfIssues, true, id)
        getIssues(arg.url, id)
    } else if (arg.type == 'MRs') {
        displaySkeleton(numberOfMRs, true, id)
        getMRs(arg.url, id)
    } else if (arg.type == 'Comments') {
        displaySkeleton(numberOfComments, true)
        getMoreRecentComments(arg.url)
    }
})

ipcMain.on('search-recent', (event, arg) => {
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
    searchRecentlyVisited(arg)
})

ipcMain.on('change-commit', (event, arg) => {
    if (analytics) {
        if (arg) {
            visitor.event("Navigate my commits", "next").send()
        } else {
            visitor.event("Navigate my commits", "previous").send()
        }
    }
    mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "<div class=\\"commit empty\\"><div class=\\"commit-information\\"><div class=\\"commit-name skeleton\\"></div><div class=\\"commit-details skeleton\\"></div></div><div id=\\"project-name\\"></div></div>"')
    let nextCommit = changeCommit(arg, recentCommits, currentCommit)
    currentCommit = nextCommit
    getCommitDetails(nextCommit.project_id, nextCommit.push_data.commit_to, nextCommit.index)
})

ipcMain.on('change-project-commit', (event, arg) => {
    if (analytics) {
        if (arg) {
            visitor.event("Navigate project commits", "next").send()
        } else {
            visitor.event("Navigate project commits", "previous").send()
        }
    }
    mb.window.webContents.executeJavaScript('document.getElementById("project-pipeline").innerHTML = "<div class=\\"commit empty\\"><div class=\\"commit-information\\"><div class=\\"commit-name skeleton\\"></div><div class=\\"commit-details skeleton\\"></div></div><div id=\\"project-name\\"></div></div>"')
    let nextCommit = changeCommit(arg, recentProjectCommits, currentProjectCommit)
    currentProjectCommit = nextCommit
    getProjectCommitDetails(currentProject.id, nextCommit.id, nextCommit.index)
})

ipcMain.on('add-bookmark', (event, arg) => {
    if (analytics) {
        visitor.event("Add bookmark").send()
    }
    addBookmark(arg)
})

ipcMain.on('add-project', (event, arg) => {
    if (analytics) {
        visitor.event("Add project").send()
    }
    addProject(arg.input, arg.target)
})

ipcMain.on('start-bookmark-dialog', (event, arg) => {
    startBookmarkDialog()
})

ipcMain.on('start-project-dialog', (event, arg) => {
    startProjectDialog()
})

ipcMain.on('delete-bookmark', (event, arg) => {
    if (analytics) {
        visitor.event("Delete bookmark").send()
    }
    let bookmarks = store.get('bookmarks')
    let newBookmarks = bookmarks.filter(bookmark => {
        return bookmark.url != arg
    })
    store.set('bookmarks', newBookmarks)
    getBookmarks()
})

ipcMain.on('delete-project', (event, arg) => {
    if (analytics) {
        visitor.event("Delete project").send()
    }
    let projects = store.get('favorite-projects')
    let newProjects = projects.filter(project => {
        return project.id != arg
    })
    store.set('favorite-projects', newProjects)
    //TODO Implement better way to refresh view after deleting project
    displayUsersProjects()
    openSettingsPage()
})

ipcMain.on('change-theme', (event, arg) => {
    if (analytics) {
        visitor.event("Change theme", arg).send()
    }
    changeTheme(arg, true)
})

ipcMain.on('change-analytics', (event, arg) => {
    store.set('analytics', arg)
    analytics = arg
    if (analytics) {
        visitor = ua('UA-203420427-1', analytics_id);
    } else {
        visitor = null
    }
})

ipcMain.on('start-login', (event, arg) => {
    startLogin()
})

ipcMain.on('start-manual-login', (event, arg) => {
    saveUser(arg.access_token, arg.host)
})

ipcMain.on('logout', (event, arg) => {
    if (analytics) {
        visitor.event("Log out", true).send()
    }
    logout()
})


mb.on('ready', () => {
    setupContextMenu()
})

if (access_token && user_id && username) {
    mb.on('after-create-window', () => {
        mb.showWindow()
        changeTheme(store.get('theme'), false)

        //Preloading content
        getUser()
        getLastTodo()
        getUsersPlan()
        getRecentlyVisited()
        getLastCommits()
        getRecentComments()
        displayUsersProjects()
        getBookmarks()

        //Regularly relaoading content
        setInterval(function () {
            getLastEvent()
            getLastTodo()
        }, 10000);

        //mb.window.webContents.openDevTools()
        mb.window.webContents.setWindowOpenHandler(({ url }) => {
            if (analytics) {
                visitor.event("Visit external link", true).send()
            }
            shell.openExternal(url);
            return { action: 'deny' };
        });
    })


    mb.on('show', () => {
        if (analytics) {
            visitor.pageview("/").send()
        }
        getRecentlyVisited()
        getLastCommits()
        getRecentComments()
        displayUsersProjects()
        getBookmarks()
    })
} else {
    mb.on('after-create-window', () => {
        mb.window.loadURL(`file://${__dirname}/login.html`).then(() => {
            changeTheme(store.get('theme'), false)
            mb.showWindow()
        })
    })
}

function setupContextMenu() {
    const baseMenuItems = [
        { label: 'Settings', click: () => { openSettingsPage() } },
        { label: 'Quit', click: () => { mb.app.quit(); } }
    ]

    if (process.platform === 'linux') {
        setupLinuxContextMenu(baseMenuItems)
    } else {
        setupGenericContextMenu(baseMenuItems)
    }
}

function setupLinuxContextMenu(baseMenuItems) {
    const menu = Menu.buildFromTemplate([
        { label: 'Open GitDock', click: () => mb.showWindow(), visible: process.platform === 'linux' },
        ...baseMenuItems
    ])

    mb.tray.setContextMenu(menu)
}

function setupGenericContextMenu(baseMenuItems) {
    const menu = Menu.buildFromTemplate(baseMenuItems)

    mb.tray.on('right-click', () => {
        mb.tray.popUpContextMenu(menu)
    })
}

function openSettingsPage() {
    if (!mb._isVisible) {
        mb.showWindow()
    }
    if (analytics) {
        visitor.pageview("/settings").send()
    }
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").innerHTML = "Settings"')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = ""')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-view").style.left = 0')
    mb.window.webContents.executeJavaScript('document.body.style.overflow = "hidden"')
    let lightString = "'light'"
    let darkString = "'dark'"
    mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<span class=\\"name\\">Theme</span>"')
    let settingsString = ''
    let theme = '<div id=\\"theme-selection\\"><div id=\\"light-mode\\" class=\\"theme-option\\" onclick=\\"changeTheme(' + lightString + ')\\"><div class=\\"indicator\\"></div>Light</div><div id=\\"dark-mode\\" class=\\"theme-option\\" onclick=\\"changeTheme(' + darkString + ')\\"><div class=\\"indicator\\"></div>Dark</div></div>'
    if (user_id && username) {
        let projects = store.get('favorite-projects')
        let favoriteProjects = '<div class=\\"headline\\"><span class=\\"name\\">Favorite projects</span></div><div id=\\"favorite-projects\\"><ul class=\\"list-container\\">'
        if (projects && projects.length > 0) {
            for (let project of projects) {
                favoriteProjects += '<li><svg xmlns=\\"http://www.w3.org/2000/svg\\"><path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M2 13.122a1 1 0 00.741.966l7 1.876A1 1 0 0011 14.998V14h2a1 1 0 001-1V3a1 1 0 00-1-1h-2v-.994A1 1 0 009.741.04l-7 1.876A1 1 0 002 2.882v10.24zM9 2.31v11.384l-5-1.34V3.65l5-1.34zM11 12V4h1v8h-1z\\" class=\\"icon\\"/></svg><div class=\\"name-with-namespace\\"><span>' + escapeHtml(project.name) + '</span><span class=\\"namespace\\">' + escapeHtml(project.namespace.name) + '</span></div>'
                favoriteProjects += '<div class=\\"bookmark-delete-wrapper\\"><div class=\\"bookmark-delete\\" onclick=\\"deleteProject(' + project.id + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" d=\\"M14,3 C14.5522847,3 15,3.44771525 15,4 C15,4.55228475 14.5522847,5 14,5 L13.846,5 L13.1420511,14.1534404 C13.0618518,15.1954311 12.1930072,16 11.1479,16 L4.85206,16 C3.80698826,16 2.93809469,15.1953857 2.8579545,14.1533833 L2.154,5 L2,5 C1.44771525,5 1,4.55228475 1,4 C1,3.44771525 1.44771525,3 2,3 L5,3 L5,2 C5,0.945642739 5.81588212,0.0818352903 6.85073825,0.00548576453 L7,0 L9,0 C10.0543573,0 10.9181647,0.815882118 10.9945142,1.85073825 L11,2 L11,3 L14,3 Z M11.84,5 L4.159,5 L4.85206449,14.0000111 L11.1479,14.0000111 L11.84,5 Z M9,2 L7,2 L7,3 L9,3 L9,2 Z\\"/></svg></div></div></li>'
            }
        }
        favoriteProjects += '<li id=\\"add-project-dialog\\" class=\\"more-link\\"><a onclick=\\"startProjectDialog()\\">Add another project <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul></div>'
        let analyticsString = '<div class=\\"headline\\"><span class=\\"name\\">Analytics</span></div><div id=\\"analytics\\">'
        analyticsString += 'To better understand how you navigate around GitLab, we would love to collect insights about your usage. All data is 100% anonymous and we do not track the specific content (projects, issues...) you are interacting with, only which kind of areas you are using.</div>'
        analyticsString += '<form id=\\"analytics-form\\"><div><input type=\\"radio\\" id=\\"analytics-yes\\" name=\\"analytics\\" value=\\"yes\\"' + (analytics ? " checked" : "") + ' onclick=\\"changeAnalytics(true)\\"><label for=\\"analytics-yes\\">Yes, collect anonymous data</label></div><div><input type=\\"radio\\" id=\\"analytics-no\\" name=\\"analytics\\" value=\\"no\\"' + (!analytics ? " checked" : "") + ' onclick=\\"changeAnalytics(false)\\"><label for=\\"analytics-no\\">No, do not collect any data</label></div></form>'
        let logout = '<div class=\\"headline\\"><span class=\\"name\\">User</span></div><div id=\\"user-administration\\"><button id=\\"logout-button\\" onclick=\\"logout()\\">Log out</button></div>'
        settingsString = theme + favoriteProjects + analyticsString + logout
    } else {
        settingsString = theme
    }
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + settingsString + '</div>"')
    mb.window.webContents.executeJavaScript('document.getElementById("light-mode").classList.remove("active")')
    mb.window.webContents.executeJavaScript('document.getElementById("dark-mode").classList.remove("active")')
    mb.window.webContents.executeJavaScript('document.getElementById("' + store.get('theme') + '-mode").classList.add("active")')
}

async function startLogin() {
    await mb.window.loadURL(host + '/oauth/authorize?client_id=2ab9d5c2290a3efcacbd5fc99ef469b7767ef5656cfc09376944b03ef4a8acee&redirect_uri=' + host + '&response_type=token&state=test&scope=read_api')
    mb.window.on('page-title-updated', handleLogin)
    mb.showWindow()
}

function handleLogin() {
    if (mb.window.webContents.getURL().indexOf('#access_token=') != '-1') {
        const code = mb.window.webContents.getURL().split('#access_token=')[1].replace('&token_type=Bearer&state=test', '')
        saveUser(code)
    } else {
        console.log('not loaded')
    }
}

function saveUser(code, url = host) {
    let temp_access_token = code
    fetch(url + '/api/v4/user?access_token=' + temp_access_token).then(result => {
        return result.json()
    }).then(result => {
        if (result && result.id && result.username) {
            store.set('access_token', temp_access_token)
            access_token = temp_access_token
            store.set('user_id', result.id)
            user_id = result.id
            store.set('username', result.username)
            username = result.username
            store.set('host', url)
            host = url
            store.set('theme', 'dark')
            store.set('analytics', false)
            getUsersProjects().then(async projects => {
                if (projects && projects.length > 0) {
                    store.set('favorite-projects', projects)
                }
                mb.window.removeListener('page-title-updated', handleLogin)
                await mb.window.loadURL(`file://${__dirname}/index.html`).then(result => {
                    getUser()
                    displayUsersProjects()
                    getBookmarks()
                    getRecentlyVisited()
                    getLastCommits()
                    getRecentComments()
                    mb.window.webContents.setWindowOpenHandler(({ url }) => {
                        shell.openExternal(url);
                        return { action: 'deny' };
                    });
                }).catch(error => {
                    getUser()
                    displayUsersProjects()
                    getBookmarks()
                    getRecentlyVisited()
                    getLastCommits()
                    getRecentComments()
                    mb.window.webContents.setWindowOpenHandler(({ url }) => {
                        shell.openExternal(url);
                        return { action: 'deny' };
                    });
                })
            })
        } else {
            console.log('not valid')
        }
    }).catch(error => {
        console.log('not valid')
    })
}

function getUser() {
    if (lastUserExecutionFinished && lastUserExecution + delay < Date.now()) {
        lastUserExecutionFinished = false
        fetch(host + '/api/v4/user?access_token=' + access_token).then(result => {
            return result.json()
        }).then(user => {
            if (user && !user.error) {
                let avatar_url
                if (user.avatar_url) {
                    avatar_url = new URL(user.avatar_url)
                    if (avatar_url.host != 'secure.gravatar.com') {
                        avatar_url.href += '?width=64'
                    }
                }
                let userString = '<a href=\\"' + user.web_url + '\\" target=\\"_blank\\"><img src=\\"' + avatar_url.href + '\\" /><div class=\\"user-information\\"><span class=\\"user-name\\">' + escapeHtml(user.name) + '</span><span class=\\"username\\">@' + escapeHtml(user.username) + '</span></div></a>'
                mb.window.webContents.executeJavaScript('document.getElementById("user").innerHTML = "' + userString + '"')
                lastUserExecution = Date.now()
                lastUserExecutionFinished = true
            } else {
                logout()
            }
        })
    } else {
        console.log('User running or not out of delay')
    }
}

async function getUsersPlan() {
    fetch(host + '/api/v4/namespaces?access_token=' + access_token).then(result => {
        return result.json()
    }).then(namespaces => {
        let namespace = namespaces.filter(namespace => namespace.kind == 'user')[0]
        if (namespace && namespace.plan) {
            plan = namespace.plan
        } else {
            plan = 'free'
        }
        store.set('plan', plan)
    })
}

function getLastEvent() {
    if (recentCommits && recentCommits.length > 0) {
        fetch(url = host + '/api/v4/events?action=pushed&per_page=1&access_token=' + access_token).then(result => {
            return result.json()
        }).then(events => {
            let event = events[0]
            if (event.id != lastEventId) {
                lastEventId = event.id
                getLastCommits()
                getRecentComments()
            }
        })

    }
}

function getLastTodo() {
    fetch(host + '/api/v4/todos?per_page=1&access_token=' + access_token).then(result => {
        return result.json()
    }).then(todos => {
        todo = todos[0]
        if(lastTodoId != todo.id) {
            if(lastTodoId != -1 && Date.parse(todo.created_at) > Date.now() - 20000 ) {
                let todoNotification = new Notification({ title: todo.body, subtitle: todo.author.name, body: todo.target.title })
                todoNotification.on('click', result => {
                    shell.openExternal(todo.target_url)
                })
                todoNotification.show()
            }
            lastTodoId = todo.id
        }
    })
}

function getLastCommits(count = 20) {
    if (lastLastCommitsExecutionFinished && lastLastCommitsExecution + delay < Date.now()) {
        lastLastCommitsExecutionFinished = false
        fetch(url = host + '/api/v4/events?action=pushed&per_page=' + count + '&access_token=' + access_token).then(result => {
            return result.json()
        }).then(commits => {
            if (commits && commits.length > 0) {
                lastEventId = commits[0].id
                getLastPipelines(commits)
                let committedArray = commits.filter(commit => {
                    return (commit.action_name == 'pushed to' || (commit.action_name == 'pushed new' && commit.push_data.commit_to && commit.push_data.commit_count > 0))
                })
                if (committedArray && committedArray.length > 0) {
                    currentCommit = committedArray[0]
                    recentCommits = committedArray
                    getCommitDetails(committedArray[0].project_id, committedArray[0].push_data.commit_to, 1)
                } else {
                    mb.window.webContents.executeJavaScript('document.getElementById("commits-pagination").innerHTML = ""')
                    mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "<p class=\\"no-results\\">You haven&#039;t pushed any commits yet.</p>"')
                }
            } else {
                mb.window.webContents.executeJavaScript('document.getElementById("commits-pagination").innerHTML = ""')
                mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "<p class=\\"no-results\\">You haven&#039;t pushed any commits yet.</p>"')
            }
            lastLastCommitsExecution = Date.now()
            lastLastCommitsExecutionFinished = true
        })
    }
}

function getProjectCommits(project, count = 20) {
    fetch(host + '/api/v4/projects/' + project.id + '/repository/commits/?per_page=' + count + '&access_token=' + access_token).then(result => {
        return result.json()
    }).then(commits => {
        if (commits && commits.length > 0) {
            recentProjectCommits = commits
            currentProjectCommit = commits[0]
            fetch(host + '/api/v4/projects/' + project.id + '/repository/commits/' + commits[0].id + '?access_token=' + access_token).then(result => {
                return result.json()
            }).then(commit => {
                let pagination = '<div id=\\"project-commits-pagination\\"><span class=\\"name\\">Commits</span><div id=\\"commits-pagination\\"><span id=\\"project-commits-count\\">1/' + recentProjectCommits.length + '</span><button onclick=\\"changeProjectCommit(false)\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M10.707085,3.70711 C11.097605,3.31658 11.097605,2.68342 10.707085,2.29289 C10.316555,1.90237 9.683395,1.90237 9.292865,2.29289 L4.292875,7.29289 C3.902375,7.68342 3.902375,8.31658 4.292875,8.70711 L9.292865,13.7071 C9.683395,14.0976 10.316555,14.0976 10.707085,13.7071 C11.097605,13.3166 11.097605,12.6834 10.707085,12.2929 L6.414185,8 L10.707085,3.70711 Z\\" /></svg></button><button onclick=\\"changeProjectCommit(true)\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\" /></svg></button></div></div>'
                mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "' + pagination + '"')
                mb.window.webContents.executeJavaScript('document.getElementById("project-pipeline").innerHTML = "' + displayCommit(commit, project, 'author') + '"')
            })
        } else {
            mb.window.webContents.executeJavaScript('document.getElementById("project-commits-pagination").innerHTML = "<span class=\\"name\\">Commits</span>"')
            mb.window.webContents.executeJavaScript('document.getElementById("project-pipeline").innerHTML = "<p class=\\"no-results\\">No commits pushed yet.</p>"')
        }
    })
}

async function getLastPipelines(commits) {
    let projectArray = []
    if (commits && commits.length > 0) {
        for (let commit of commits) {
            if (!projectArray.includes(commit.project_id)) {
                projectArray.push(commit.project_id)
                let result = await fetch(host + '/api/v4/projects/' + commit.project_id + '/pipelines?status=running&username=' + username + '&per_page=1&page=1&access_token=' + access_token)
                let pipelines = await result.json()
                if (pipelines && pipelines.length > 0) {
                    mb.tray.setImage(__dirname + '/assets/runningTemplate.png')
                    for (let pipeline of pipelines) {
                        if (runningPipelineSubscriptions.findIndex(subscriptionPipeline => subscriptionPipeline.id == pipeline.id) == -1) {
                            let result = await fetch(host + '/api/v4/projects/' + pipeline.project_id + '/repository/commits/' + pipeline.sha + '?access_token=' + access_token)
                            let commit = await result.json()
                            pipeline.commit_title = commit.title
                            runningPipelineSubscriptions.push(pipeline)
                            let runningNotification = new Notification({ title: 'Pipeline running', subtitle: parse(pipeline.web_url).namespaceWithProject, body: pipeline.commit_title })
                            runningNotification.on('click', result => {
                                shell.openExternal(pipeline.web_url)
                            })
                            runningNotification.show()
                        }
                    }
                    subscribeToRunningPipeline()
                }
            }
        }
    }
}

async function subscribeToRunningPipeline() {
    let interval = setInterval(async function () {
        for (let runningPipeline of runningPipelineSubscriptions) {
            let result = await fetch(host + '/api/v4/projects/' + runningPipeline.project_id + '/pipelines/' + runningPipeline.id + '?access_token=' + access_token)
            let pipeline = await result.json()
            if (pipeline.status != 'running') {
                if (pipeline.status == 'success') {
                    pipelineStatus = 'succeeded'
                } else {
                    pipelineStatus = pipeline.status
                }
                let updateNotification = new Notification({ title: 'Pipeline ' + pipelineStatus, subtitle: parse(pipeline.web_url).namespaceWithProject, body: runningPipeline.commit_title })
                updateNotification.on('click', () => {
                    shell.openExternal(pipeline.web_url)
                })
                updateNotification.show()
                runningPipelineSubscriptions = runningPipelineSubscriptions.filter(subscriptionPipeline => subscriptionPipeline.id != pipeline.id)
                if (runningPipelineSubscriptions.length == 0) {
                    clearInterval(interval)
                    mb.tray.setImage(__dirname + '/assets/gitlabTemplate.png')
                }
            }
        }
    }, 10000);
}

function changeCommit(forward = true, commitArray, chosenCommit) {
    let nextCommit
    let index = commitArray.findIndex(commit => commit.id == chosenCommit.id)
    if (forward) {
        if (index == commitArray.length - 1) {
            nextCommit = commitArray[0]
            index = 1
        } else {
            nextCommit = commitArray[index + 1]
            index += 2
        }
    } else {
        if (index == 0) {
            nextCommit = commitArray[commitArray.length - 1]
            index = commitArray.length
        } else {
            nextCommit = commitArray[index - 1]
        }
    }
    nextCommit.index = index
    return nextCommit
}

function getCommitDetails(project_id, sha, index) {
    mb.window.webContents.executeJavaScript('document.getElementById("commits-count").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("commits-count").innerHTML = "' + index + '/' + recentCommits.length + '"')
    fetch(host + '/api/v4/projects/' + project_id + '?access_token=' + access_token).then(result => {
        return result.json()
    }).then(project => {
        fetch(host + '/api/v4/projects/' + project.id + '/repository/commits/' + sha + '?access_token=' + access_token).then(result => {
            return result.json()
        }).then(commit => {
            mb.window.webContents.executeJavaScript('document.getElementById("pipeline").innerHTML = "' + displayCommit(commit, project) + '"')
        })
    })
}

function getProjectCommitDetails(project_id, sha, index) {
    mb.window.webContents.executeJavaScript('document.getElementById("project-commits-count").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("project-commits-count").innerHTML = "' + index + '/' + recentProjectCommits.length + '"')
    fetch(host + '/api/v4/projects/' + project_id + '/repository/commits/' + sha + '?access_token=' + access_token).then(result => {
        return result.json()
    }).then(commit => {
        mb.window.webContents.executeJavaScript('document.getElementById("project-pipeline").innerHTML = "' + displayCommit(commit, currentProject, 'author') + '"')
    })
}

async function getRecentlyVisited() {
    if (lastRecentlyVisitedExecutionFinished && lastRecentlyVisitedExecution + delay < Date.now()) {
        lastRecentlyVisitedExecutionFinished = false
        recentlyVisitedArray = new Array()
        let recentlyVisitedString = ''
        let firstItem = true
        await BrowserHistory.getAllHistory(14320).then(async history => {
            let item = Array.prototype.concat.apply([], history);
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
                if (item[j].title && item[j].url.indexOf(host + '/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !recentlyVisitedArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New merge request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ') {
                    if (firstItem) {
                        recentlyVisitedString = '<ul class=\\"list-container\\">'
                        firstItem = false
                    }
                    let nameWithNamespace = item[j].url.replace(host + '/', '').split('/-/')[0]
                    if (nameWithNamespace.split('/')[0] != 'groups') {
                        url = host + '/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
                    } else {
                        url = host + '/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
                    }
                    recentlyVisitedArray.push(item[j].title)
                    recentlyVisitedString += '<li class=\\"history-entry\\">'
                    recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item[j].utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item[j].url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[2].trim()) + '</a></span></div></li>'
                    i++
                    if (i == numberOfRecentlyVisited) {
                        break
                    }
                }
            }
            if (!firstItem) {
                let moreString = "'Recently viewed'"
                recentlyVisitedString += '<li class=\\"more-link\\"><a onclick=\\"goToDetail(' + moreString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
            } else {
                recentlyVisitedString = '<p class=\\"no-results\\">Recently visited objects will show up here.<br/><span class=\\"supported-browsers\\">Supported browsers: ${BrowserHistory.supportedBrowserNames()}.</span></p>'
            }
            mb.window.webContents.executeJavaScript('document.getElementById("history").innerHTML = "' + recentlyVisitedString + '"')
            lastRecentlyVisitedExecution = Date.now()
            lastRecentlyVisitedExecutionFinished = true
        })
    } else {
        console.log('Recently visited running or not out of delay')
    }
}

async function getMoreRecentlyVisited() {
    recentlyVisitedString = ''
    let moreRecentlyVisitedTitlesArray = []
    let firstItem = true
    await BrowserHistory.getAllHistory(14320).then(async history => {
        let item = Array.prototype.concat.apply([], history);
        item.sort(function (a, b) {
            if (a.utc_time > b.utc_time) {
                return -1
            }
            if (b.utc_time > a.utc_time) {
                return 1
            }
        });
        let i = 0
        mb.window.webContents.executeJavaScript('document.getElementById("detail-headline").innerHTML = "<input id=\\"recentSearch\\" type=\\"text\\" onkeyup=\\"searchRecent(this)\\" placeholder=\\"Search...\\" />"')
        let previousDate = 0
        for (let j = 0; j < item.length; j++) {
            if (item[j].title && item[j].url.indexOf(host + '/') == 0 && (item[j].url.indexOf('/-/issues/') != -1 || item[j].url.indexOf('/-/merge_requests/') != -1 || item[j].url.indexOf('/-/epics/') != -1) && !moreRecentlyVisitedTitlesArray.includes(item[j].title) && item[j].title.split('·')[0] != 'Not Found' && item[j].title.split('·')[0] != 'New Issue ' && item[j].title.split('·')[0] != 'New Merge Request ' && item[j].title.split('·')[0] != 'New merge request ' && item[j].title.split('·')[0] != 'New Epic ' && item[j].title.split('·')[0] != 'Edit ' && item[j].title.split('·')[0] != 'Merge requests ' && item[j].title.split('·')[0] != 'Issues ' && item[j].title.split('·')[0] != '500 Error - GitLab') {
                let nameWithNamespace = item[j].url.replace(host + '/', '').split('/-/')[0]
                if (nameWithNamespace.split('/')[0] != 'groups') {
                    url = host + '/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
                } else {
                    url = host + '/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
                }
                let currentDate = new Date(item[j].utc_time).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })
                if (previousDate != currentDate) {
                    if (currentDate == new Date(Date.now()).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })) {
                        recentlyVisitedString += '<div class=\\"date\\">Today</div>'
                    } else {
                        if (!firstItem) {
                            recentlyVisitedString += '</ul>'
                        }
                        recentlyVisitedString += '<div class=\\"date\\">' + currentDate + '</div>'
                    }
                    recentlyVisitedString += '<ul class=\\"list-container history-list-container\\">'
                    previousDate = currentDate
                }
                moreRecentlyVisitedArray.push(item[j])
                moreRecentlyVisitedTitlesArray.push(item[j].title)
                recentlyVisitedString += '<li class=\\"history-entry\\">'
                recentlyVisitedString += '<a href=\\"' + item[j].url + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item[j].utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item[j].url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(item[j].title.split('·')[2].trim()) + '</a></span></div></li>'
                firstItem = false
            }
        }
        recentlyVisitedString += '</ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + recentlyVisitedString + '"')
    })
}

function searchRecentlyVisited(searchterm) {
    let foundArray = moreRecentlyVisitedArray.filter(item => {
        return item.title.toLowerCase().includes(searchterm)
    })
    foundString = '<ul class=\\"list-container\\">'
    for (let item of foundArray) {
        let nameWithNamespace = item.url.replace(host + '/', '').split('/-/')[0]
        if (nameWithNamespace.split('/')[0] != 'groups') {
            url = host + '/api/v4/projects/' + nameWithNamespace.split('/')[0] + '%2F' + nameWithNamespace.split('/')[1] + '?access_token=' + access_token
        } else {
            url = host + '/api/v4/groups/' + nameWithNamespace.split('/')[0] + '?access_token=' + access_token
        }
        foundString += '<li class=\\"history-entry\\">'
        foundString += '<a href=\\"' + item.url + '\\" target=\\"_blank\\">' + escapeHtml(item.title.split('·')[0]) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(item.utc_time + ' UTC')) + ' ago &middot; <a href=\\"' + item.url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(item.title.split('·')[2].trim()) + '</a></span></div></li>'
    }
    foundString += '</ul>'
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + foundString + '"')
}

async function getUsersProjects() {
    let result = await fetch(host + '/api/v4/users/' + user_id + '/starred_projects?min_access_level=30&per_page=' + numberOfFavoriteProjects + '&order_by=updated_at&access_token=' + access_token)
    let projects = await result.json()
    let projectsArray = []
    if (projects && projects.length > 0) {
        for (let project of projects) {
            //TODO Figure out a way to see avatars of private repositories
            /*if(project.visibility == 'public') {
                favoriteProjectsString += '<li><img src=\\"' + project.avatar_url + '\\">'
            }*/
            let projectObject = {
                id: project.id,
                visibility: project.visibility,
                web_url: project.web_url,
                name: project.name,
                namespace: {
                    name: project.namespace.name
                },
                added: Date.now(),
                name_with_namespace: project.name_with_namespace,
                open_issues_count: project.open_issues_count,
                last_activity_at: project.last_activity_at,
                avatar_url: project.avatar_url,
                star_count: project.star_count,
                forks_count: project.forks_count,
            }
            projectsArray.push(projectObject)
        }
    }
    return projectsArray
}

function displayUsersProjects() {
    let favoriteProjectsString = ''
    let projects = store.get('favorite-projects')
    if (projects && projects.length > 0) {
        favoriteProjectsString += '<ul id=\\"projects\\" class=\\"list-container clickable\\">'
        let chevron = '<svg class=\\"chevron\\" xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\" /></svg>'
        for (let projectObject of projects) {
            let projectString = "'Project'"
            let jsonProjectObject = JSON.parse(JSON.stringify(projectObject))
            jsonProjectObject.name_with_namespace = escapeQuotes(projectObject.name_with_namespace)
            jsonProjectObject.namespace.name = escapeQuotes(projectObject.namespace.name)
            jsonProjectObject.name = escapeQuotes(projectObject.name)
            let projectJson = "'" + escapeHtml(JSON.stringify(jsonProjectObject)) + "'"
            favoriteProjectsString += '<li onclick=\\"goToDetail(' + projectString + ', ' + projectJson + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\"><path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M2 13.122a1 1 0 00.741.966l7 1.876A1 1 0 0011 14.998V14h2a1 1 0 001-1V3a1 1 0 00-1-1h-2v-.994A1 1 0 009.741.04l-7 1.876A1 1 0 002 2.882v10.24zM9 2.31v11.384l-5-1.34V3.65l5-1.34zM11 12V4h1v8h-1z\\" class=\\"icon\\"/></svg>'
            favoriteProjectsString += '<div class=\\"name-with-namespace\\"><span>' + escapeHtml(projectObject.name) + '</span><span class=\\"namespace\\">' + escapeHtml(projectObject.namespace.name) + '</span></div>' + chevron + '</li>'
        }
        favoriteProjectsString += '</ul>'
    } else {
        let projectLink = "'project-overview-link'"
        favoriteProjectsString = '<div class=\\"new-project\\"><div><span class=\\"cta\\">Track projects you care about</span> 🌟</div><div class=\\"cta-description\\">Add any project you want a directly accessible shortcut for.</div><form class=\\"project-input\\" action=\\"#\\" onsubmit=\\"addProject(document.getElementById(' + projectLink + ').value, ' + projectLink + ');return false;\\"><input class=\\"project-link\\" id=\\"project-overview-link\\" placeholder=\\"Enter the project link here...\\" /><button class=\\"add-button\\" id=\\"project-overview-add-button\\" type=\\"submit\\">Add</button></form><div class=\\"add-project-error\\" id=\\"add-project-overview-error\\"></div></div>'
    }
    mb.window.webContents.executeJavaScript('document.getElementById("projects").innerHTML = "' + favoriteProjectsString + '"')
}

function getRecentComments() {
    if (lastRecentCommentsExecutionFinished && lastRecentCommentsExecution + delay < Date.now()) {
        lastRecentCommentsExecutionFinished = false
        let recentCommentsString = ''
        fetch(host + '/api/v4/events?action=commented&per_page=' + numberOfRecentComments + '&access_token=' + access_token).then(result => {
            return result.json()
        }).then(async comments => {
            if (comments && comments.length > 0) {
                recentCommentsString += '<ul class=\\"list-container\\">'
                for (let comment of comments) {
                    let url = ''
                    if (comment.note.noteable_type == 'MergeRequest') {
                        url = host + '/api/v4/projects/' + comment.project_id + '/merge_requests/' + comment.note.noteable_iid + '?access_token=' + access_token
                    } else if (comment.note.noteable_type == 'Issue') {
                        url = host + '/api/v4/projects/' + comment.project_id + '/issues/' + comment.note.noteable_iid + '?access_token=' + access_token
                    } else if (comment.note.noteable_type == 'Commit') {
                        url = host + '/api/v4/projects/' + comment.project_id + '/repository/commits/' + comment.note.position.head_sha + '?access_token=' + access_token
                    } else if (comment.note.noteable_type == 'Snippet') {
                        url = host + '/api/v4/projects/' + comment.project_id + '/snippets/' + comment.note.noteable_id + '?access_token=' + access_token
                    } else if (comment.note.noteable_type == 'DesignManagement::Design') {
                        url = host + '/api/v4/projects/' + comment.project_id + '/issues/' + comment.note.position.new_path.split('/')[1].split('-')[1] + '?access_token=' + access_token
                    } else {
                        continue
                    }
                    await fetch(url).then(result => {
                        return result.json()
                    }).then(collabject => {
                        if (collabject.message && collabject.message == '404 Not found') {
                            console.log('deleted')
                        } else {
                            if (comment.note.noteable_type == 'DesignManagement::Design') {
                                collabject.web_url += '/designs/' + comment.target_title
                                recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
                            } else {
                                recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
                            }
                        }
                    })
                }
                let moreString = "'Comments'"
                recentCommentsString += '<li class=\\"more-link\\"><a onclick=\\"goToDetail(' + moreString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
                mb.window.webContents.executeJavaScript('document.getElementById("comments").innerHTML = "' + recentCommentsString + '"')
            } else {
                mb.window.webContents.executeJavaScript('document.getElementById("comments").innerHTML = "<p class=\\"no-results\\">You haven&#039;t written any comments yet.</p>"')
            }
            lastRecentCommentsExecution = Date.now()
            lastRecentCommentsExecutionFinished = true
        })
    } else {
        console.log('Recent comments running or not out of delay')
    }
}

function getMoreRecentComments(url = host + '/api/v4/events?action=commented&per_page=' + numberOfComments + '&access_token=' + access_token) {
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
                url = host + '/api/v4/projects/' + comment.project_id + '/merge_requests/' + comment.note.noteable_iid + '?access_token=' + access_token
            } else if (comment.note.noteable_type == 'Issue') {
                url = host + '/api/v4/projects/' + comment.project_id + '/issues/' + comment.note.noteable_iid + '?access_token=' + access_token
            } else if (comment.note.noteable_type == 'Commit') {
                url = host + '/api/v4/projects/' + comment.project_id + '/repository/commits/' + comment.note.position.head_sha + '?access_token=' + access_token
            } else if (comment.note.noteable_type == 'Snippet') {
                url = host + '/api/v4/projects/' + comment.project_id + '/snippets/' + comment.note.noteable_id + '?access_token=' + access_token
            } else if (comment.note.noteable_type == 'DesignManagement::Design') {
                url = host + '/api/v4/projects/' + comment.project_id + '/issues/' + comment.note.position.new_path.split('/')[1].split('-')[1] + '?access_token=' + access_token
            } else {
                continue
            }
            await fetch(url).then(result => {
                return result.json()
            }).then(collabject => {
                if (collabject.message && collabject.message == '404 Not found') {
                    console.log('deleted')
                } else {
                    if (comment.note.noteable_type == 'DesignManagement::Design') {
                        collabject.web_url += '/designs/' + comment.target_title
                        recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
                    } else {
                        recentCommentsString += '<li class=\\"comment\\"><a href=\\"' + collabject.web_url + '#note_' + comment.note.id + '\\" target=\\"_blank\\">' + escapeHtml(comment.note.body) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(comment.created_at)) + ' ago &middot; <a href=\\"' + collabject.web_url.split('#note')[0] + '\\" target=\\"_blank\\">' + escapeHtml(comment.target_title) + '</a></span></div></li>'
                    }
                }
            })
        }
        recentCommentsString += '</ul>' + displayPagination(keysetLinks, type)
        mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + recentCommentsString + '"')
    })
}

function getIssues(url = host + '/api/v4/issues?scope=assigned_to_me&state=opened&order_by=created_at&per_page=' + numberOfIssues + '&access_token=' + access_token, id = 'detail-content') {
    let issuesString = ''
    let type = "'Issues'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(issues => {
        if (issues && issues.length > 0) {
            issuesString += '<ul class=\\"list-container\\">'
            for (let issue of issues) {
                let timestamp
                if (activeIssuesSortOption == 'updated_at') {
                    timestamp = 'Updated ' + timeSince(new Date(issue.updated_at)) + ' ago'
                } else if (activeIssuesSortOption == 'created_at') {
                    timestamp = 'Created ' + timeSince(new Date(issue.created_at)) + ' ago'
                } else if (activeIssuesSortOption == 'due_date&sort=asc') {
                    if(!issue.due_date) {
                        timestamp = 'No due date'
                    }else if(new Date() > new Date(issue.due_date)) {
                        timestamp = 'Due ' + timeSince(new Date(issue.due_date)) + ' ago'
                    }else{
                        timestamp = 'Due in ' + timeSince(new Date(issue.due_date), 'to')
                    }
                }
                issuesString += '<li class=\\"history-entry\\">'
                issuesString += '<a href=\\"' + issue.web_url + '\\" target=\\"_blank\\">' + escapeHtml(issue.title) + '</a><span class=\\"namespace-with-time\\">' + timestamp + ' &middot; <a href=\\"' + issue.web_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(issue.references.full.split('#')[0]) + '</a></span></div></li>'
            }
            issuesString += '</ul>' + displayPagination(keysetLinks, type)
        } else {
            let illustration = escapeQuotes('<svg width="150" height="110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 293 216"><g fill="none" fill-rule="evenodd"><g transform="rotate(-5 211.388 -693.89)"><rect width="163.6" height="200" x=".2" stroke="#BBB" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 9" rx="6"/><g transform="translate(24 38)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#6B4FBB" opacity=".5" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#6B4FBB" opacity=".5" rx="1.5"/></g><g transform="translate(24 83)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g><g transform="translate(24 130)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g></g><path fill="#FFCE29" d="M30 11l-1.8 4-2-4-4-1.8 4-2 2-4 2 4 4 2M286 60l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8M263 97l-2 4-2-4-4-2 4-2 2-4 2 4 4 2M12 85l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8"/></g></svg>')
            issuesString = '<div class=\\"zero\\">' + illustration + '<p>No issues with the specified criteria.</p></div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("' + id + '").innerHTML = "' + issuesString + '"')
    })
}

function getMRs(url = host + '/api/v4/merge_requests?scope=assigned_to_me&state=opened&order_by=created_at&per_page=' + numberOfMRs + '&access_token=' + access_token, id = 'detail-content') {
    let mrsString = ''
    let type = "'MRs'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(mrs => {
        if (mrs && mrs.length > 0) {
            mrsString = '<ul class=\\"list-container\\">'
            for (let mr of mrs) {
                let timestamp
                if (activeMRsSortOption == 'updated_at') {
                    timestamp = 'Updated ' + timeSince(new Date(mr.updated_at)) + ' ago'
                } else if (activeMRsSortOption == 'created_at') {
                    timestamp = 'Created ' + timeSince(new Date(mr.created_at)) + ' ago'
                }
                mrsString += '<li class=\\"history-entry\\">'
                mrsString += '<a href=\\"' + mr.web_url + '\\" target=\\"_blank\\">' + escapeHtml(mr.title) + '</a><span class=\\"namespace-with-time\\">' + timestamp + ' &middot; <a href=\\"' + mr.web_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(mr.references.full.split('!')[0]) + '</a></span></div></li>'
            }
            mrsString += '</ul>' + displayPagination(keysetLinks, type)
        } else {
            let illustration = escapeQuotes('<svg width="150" height="110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 293 216"><g fill="none" fill-rule="evenodd"><g transform="rotate(-5 211.388 -693.89)"><rect width="163.6" height="200" x=".2" stroke="#BBB" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 9" rx="6"/><g transform="translate(24 38)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#6B4FBB" opacity=".5" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#6B4FBB" opacity=".5" rx="1.5"/></g><g transform="translate(24 83)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g><g transform="translate(24 130)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g></g><path fill="#FFCE29" d="M30 11l-1.8 4-2-4-4-1.8 4-2 2-4 2 4 4 2M286 60l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8M263 97l-2 4-2-4-4-2 4-2 2-4 2 4 4 2M12 85l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8"/></g></svg>')
            mrsString = '<div class=\\"zero\\">' + illustration + '<p>No merge requests with the specified criteria.</p></div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("' + id + '").innerHTML = "' + mrsString + '"')
    })
}

function getTodos(url = host + '/api/v4/todos?per_page=' + numberOfTodos + '&access_token=' + access_token) {
    let todosString = ''
    let type = "'Todos'"
    let keysetLinks
    fetch(url).then(result => {
        keysetLinks = result.headers.get('Link')
        return result.json()
    }).then(todos => {
        if (todos && todos.length > 0) {
            todosString = '<ul class=\\"list-container\\">'
            for (let todo of todos) {
                todosString += '<li class=\\"history-entry\\">'
                let location = ''
                if (todo.project) {
                    location = todo.project.name_with_namespace
                } else if (todo.group) {
                    location = todo.group.name
                }
                if (todo.target_type == 'DesignManagement::Design') {
                    todo.target.title = todo.body
                }
                todosString += '<a href=\\"' + todo.target_url + '\\" target=\\"_blank\\">' + escapeHtml(todo.target.title) + '</a><span class=\\"namespace-with-time\\">Updated ' + timeSince(new Date(todo.updated_at)) + ' ago &middot; <a href=\\"' + todo.target_url.split('/-/')[0] + '\\" target=\\"_blank\\">' + escapeHtml(location) + '</a></span></div></li>'
            }
            todosString += '</ul>' + displayPagination(keysetLinks, type)
        } else {
            let illustration = escapeQuotes('<svg width="150" height="110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 293 216"><g fill="none" fill-rule="evenodd"><g transform="rotate(-5 211.388 -693.89)"><rect width="163.6" height="200" x=".2" stroke="#BBB" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 9" rx="6"/><g transform="translate(24 38)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#6B4FBB" opacity=".5" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#6B4FBB" opacity=".5" rx="1.5"/></g><g transform="translate(24 83)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g><g transform="translate(24 130)"><path fill="#FC6D26" d="M18.2 14l-4-3.8c-.4-.6-1.4-.6-2 0-.6.6-.6 1.5 0 2l5 5c.3.4.6.5 1 .5s.8 0 1-.4L28 8.8c.6-.6.6-1.5 0-2-.6-.7-1.6-.7-2 0L18 14z"/><path stroke="#6B4FBB" stroke-width="3" d="M27 23.3V27c0 2.3-1.7 4-4 4H4c-2.3 0-4-1.7-4-4V8c0-2.3 1.7-4 4-4h3.8" stroke-linecap="round"/><rect width="76" height="3" x="40" y="11" fill="#B5A7DD" rx="1.5"/><rect width="43" height="3" x="40" y="21" fill="#B5A7DD" rx="1.5"/></g></g><path fill="#FFCE29" d="M30 11l-1.8 4-2-4-4-1.8 4-2 2-4 2 4 4 2M286 60l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8M263 97l-2 4-2-4-4-2 4-2 2-4 2 4 4 2M12 85l-2.7 6.3-3-6-6-3 6-3 3-6 2.8 6.2 6.6 2.8"/></g></svg>')
            todosString = '<div class=\\"zero\\">' + illustration + '<p>Take the day off, you have no To-Dos!</p></div>'
        }
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
                namespace = bookmark.namespace + ' / ' + bookmark.project
            } else {
                namespace = bookmark.project
            }
            let bookmarkUrl = "'" + bookmark.url + "'"
            bookmarksString += '<li class=\\"history-entry bookmark-entry\\"><div class=\\"bookmark-information\\"><a href=\\"' + bookmark.url + '\\" target=\\"_blank\\">' + escapeHtml(bookmark.title) + '</a><span class=\\"namespace-with-time\\">Added ' + timeSince(bookmark.added) + ' ago &middot; <a href=\\"' + bookmark.locationUrl + '\\" target=\\"_blank\\">' + escapeHtml(namespace) + '</a></span></div><div class=\\"bookmark-delete-wrapper\\"><div class=\\"bookmark-delete\\" onclick=\\"deleteBookmark(' + bookmarkUrl + ')\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" d=\\"M14,3 C14.5522847,3 15,3.44771525 15,4 C15,4.55228475 14.5522847,5 14,5 L13.846,5 L13.1420511,14.1534404 C13.0618518,15.1954311 12.1930072,16 11.1479,16 L4.85206,16 C3.80698826,16 2.93809469,15.1953857 2.8579545,14.1533833 L2.154,5 L2,5 C1.44771525,5 1,4.55228475 1,4 C1,3.44771525 1.44771525,3 2,3 L5,3 L5,2 C5,0.945642739 5.81588212,0.0818352903 6.85073825,0.00548576453 L7,0 L9,0 C10.0543573,0 10.9181647,0.815882118 10.9945142,1.85073825 L11,2 L11,3 L14,3 Z M11.84,5 L4.159,5 L4.85206449,14.0000111 L11.1479,14.0000111 L11.84,5 Z M9,2 L7,2 L7,3 L9,3 L9,2 Z\\"/></svg></div></div></li>'
        })
        bookmarksString += '<li id=\\"add-bookmark-dialog\\" class=\\"more-link\\"><a onclick=\\"startBookmarkDialog()\\">Add another bookmark <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li></ul>'
        mb.window.webContents.executeJavaScript('document.getElementById("bookmarks").innerHTML = "' + bookmarksString + '"')
    } else {
        let bookmarkLink = "'bookmark-link'"
        bookmarksString = '<div id=\\"new-bookmark\\"><div><span class=\\"cta\\">Add a new GitLab bookmark</span> 🔖</div><div class=\\"cta-description\\">Bookmarks are helpful when you have an issue/merge request you will have to come back to repeatedly.</div><form id=\\"bookmark-input\\" action=\\"#\\" onsubmit=\\"addBookmark(document.getElementById(' + bookmarkLink + ').value);return false;\\"><input id=\\"bookmark-link\\" placeholder=\\"Enter the link here...\\" /><button class=\\"add-button\\" id=\\"bookmark-add-button\\" type=\\"submit\\">Add</button></form><div id=\\"add-bookmark-error\\"></div></div>'
        mb.window.webContents.executeJavaScript('document.getElementById("bookmarks").innerHTML = "' + bookmarksString + '"')
    }
}

function displayPagination(keysetLinks, type) {
    let paginationString = ''
    if (keysetLinks.indexOf('rel="next"') != -1 || keysetLinks.indexOf('rel="prev"') != -1) {
        paginationString += '<div id=\\"pagination\\">'
        if (keysetLinks.indexOf('rel="prev"') != -1) {
            let prevLink = ''
            let icon = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M10.707085,3.70711 C11.097605,3.31658 11.097605,2.68342 10.707085,2.29289 C10.316555,1.90237 9.683395,1.90237 9.292865,2.29289 L4.292875,7.29289 C3.902375,7.68342 3.902375,8.31658 4.292875,8.70711 L9.292865,13.7071 C9.683395,14.0976 10.316555,14.0976 10.707085,13.7071 C11.097605,13.3166 11.097605,12.6834 10.707085,12.2929 L6.414185,8 L10.707085,3.70711 Z\\"/></svg>'
            prevLink = escapeHtml('"' + keysetLinks.split('>; rel="prev"')[0].substring(1) + '"')
            paginationString += '<button onclick=\\"switchPage(' + prevLink + ', ' + type + ')\\" class=\\"prev\\">' + icon + ' Previous</button>'
        } else {
            paginationString += '<div></div>'
        }
        if (keysetLinks.indexOf('rel="next"') != -1) {
            let nextLink = ''
            let icon = '<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon\\" fill-rule=\\"evenodd\\" d=\\"M5.29289,3.70711 C4.90237,3.31658 4.90237,2.68342 5.29289,2.29289 C5.68342,1.90237 6.31658,1.90237 6.70711,2.29289 L11.7071,7.29289 C12.0976,7.68342 12.0976,8.31658 11.7071,8.70711 L6.70711,13.7071 C6.31658,14.0976 5.68342,14.0976 5.29289,13.7071 C4.90237,13.3166 4.90237,12.6834 5.29289,12.2929 L9.58579,8 L5.29289,3.70711 Z\\"/></svg>'
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

function setupEmptyProjectPage() {
    let emptyPage = '<div id=\\"project-pipeline\\"><div class=\\"commit empty\\"><div class=\\"commit-information\\"><div class=\\"commit-name skeleton\\"></div><div class=\\"commit-details skeleton\\"></div></div></div><div id=\\"project-name\\"></div></div>'
    emptyPage += '<div class=\\"headline\\"><span class=\\"name\\">Issues</span></div>'
    emptyPage += '<div id=\\"project-recent-issues\\"><div id=\\"history\\"><ul class=\\"list-container empty\\"><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"more-link empty\\"><div class=\\"more-link-button skeleton\\"></div></li></ul></div></div>'
    emptyPage += '<div class=\\"headline\\"><span class=\\"name\\">Merge requests</span></div>'
    emptyPage += '<div id=\\"project-recent-mrs\\"><div id=\\"history\\"><ul class=\\"list-container empty\\"><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li><li class=\\"more-link empty\\"><div class=\\"more-link-button skeleton\\"></div></li></ul></div></div>'
    mb.window.webContents.executeJavaScript('document.getElementById("detail-content").innerHTML = "' + emptyPage + '"')
}

function displayProjectPage(project) {
    let logo
    if (project.avatar_url && project.avatar_url != null && project.visibility == 'public') {
        logo = '<img id=\\"project-detail-avatar\\" src=\\"' + project.avatar_url + '?width=64\\" />'
    } else {
        logo = '<div id=\\"project-detail-name-avatar\\">' + project.name.charAt(0).toUpperCase() + '</div>'
    }
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").classList.remove("empty")')
    mb.window.webContents.executeJavaScript('document.getElementById("detail-header-content").innerHTML = "<div id=\\"project-detail-information\\">' + logo + '<span class=\\"project-name\\">' + escapeHtml(project.name) + '</span><span class=\\"project-namespace\\">' + escapeHtml(project.namespace.name) + '</span></div><div class=\\"detail-external-link\\"><a href=\\"' + project.web_url + '\\" target=\\"_blank\\"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\"><path fill-rule=\\"evenodd\\" d=\\"M5,2 C5.55228,2 6,2.44772 6,3 C6,3.55228 5.55228,4 5,4 L4,4 L4,12 L12,12 L12,11 C12,10.4477 12.4477,10 13,10 C13.5523,10 14,10.4477 14,11 L14,12 C14,13.1046 13.1046,14 12,14 L4,14 C2.89543,14 2,13.1046 2,12 L2,4 C2,2.89543 2.89543,2 4,2 L5,2 Z M15,1 L15,5.99814453 C15,6.55043453 14.5523,6.99814453 14,6.99814453 C13.4477,6.99814453 13,6.55043453 13,5.99814453 L13,4.41419 L8.71571,8.69846 C8.32519,9.08899 7.69202,9.08899 7.3015,8.69846 C6.91097,8.30794 6.91097,7.67477 7.3015,7.28425 L11.5858,3 L9.99619141,3 C9.44391141,3 8.99619141,2.55228 8.99619141,2 C8.99619141,1.44772 9.44391141,1 9.99619141,1 L15,1 Z\\"/></svg></a></div>"')
}

function getProjectIssues(project) {
    let projectIssuesString = ''
    let jsonProjectObject = JSON.parse(JSON.stringify(project))
    jsonProjectObject.name_with_namespace = escapeQuotes(project.name_with_namespace)
    jsonProjectObject.namespace.name = escapeQuotes(project.namespace.name)
    jsonProjectObject.name = escapeQuotes(project.name)
    let projectString = "'" + escapeHtml(JSON.stringify(jsonProjectObject)) + "'"
    let issuesString = "'Issues'"
    fetch(host + '/api/v4/projects/' + project.id + '/issues?state=opened&order_by=created_at&per_page=3&access_token=' + access_token).then(result => {
        return result.json()
    }).then(issues => {
        if (issues.length > 0) {
            projectIssuesString = '<ul class=\\"list-container\\">'
            for (let issue of issues) {
                projectIssuesString += '<li class=\\"history-entry\\">'
                projectIssuesString += '<a href=\\"' + issue.web_url + '\\" target=\\"_blank\\">' + escapeHtml(issue.title) + '</a><span class=\\"namespace-with-time\\">Created ' + timeSince(new Date(issue.created_at)) + ' ago &middot; ' + escapeHtml(issue.author.name) + '</span></div></li>'
            }
            projectIssuesString += '<li class=\\"more-link\\"><a onclick=\\"goToSubDetail(' + issuesString + ', ' + projectString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li>'
            projectIssuesString += '</ul>'
        } else {
            projectIssuesString = '<p class=\\"no-results with-all-link\\">No open issues.</p>'
            projectIssuesString += '<div class=\\"all-link\\"><a onclick=\\"goToSubDetail(' + issuesString + ', ' + projectString + ', true)\\">View all <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("project-recent-issues").innerHTML = "' + projectIssuesString + '"')
    })
}

function getProjectMRs(project) {
    let projectMRsString = ''
    let jsonProjectObject = JSON.parse(JSON.stringify(project))
    jsonProjectObject.name_with_namespace = escapeQuotes(project.name_with_namespace)
    jsonProjectObject.namespace.name = escapeQuotes(project.namespace.name)
    jsonProjectObject.name = escapeQuotes(project.name)
    let projectString = "'" + escapeHtml(JSON.stringify(jsonProjectObject)) + "'"
    let mrsString = "'Merge Requests'"
    fetch(host + '/api/v4/projects/' + project.id + '/merge_requests?state=opened&order_by=created_at&per_page=3&access_token=' + access_token).then(result => {
        return result.json()
    }).then(mrs => {
        if (mrs.length > 0) {
            projectMRsString += '<ul class=\\"list-container\\">'
            for (let mr of mrs) {
                projectMRsString += '<li class=\\"history-entry\\">'
                projectMRsString += '<a href=\\"' + mr.web_url + '\\" target=\\"_blank\\">' + escapeHtml(mr.title) + '</a><span class=\\"namespace-with-time\\">Created ' + timeSince(new Date(mr.created_at)) + ' ago &middot; ' + escapeHtml(mr.author.name) + '</span></div></li>'
            }
            projectMRsString += '<li class=\\"more-link\\"><a onclick=\\"goToSubDetail(' + mrsString + ', ' + projectString + ')\\">View more <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path class=\\"icon-muted\\" fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></li>'
            projectMRsString += '</ul>'
        } else {
            projectMRsString = '<p class=\\"no-results with-all-link\\">No open merge requests.</p>'
            projectMRsString += '<div class=\\"all-link\\"><a onclick=\\"goToSubDetail(' + mrsString + ', ' + projectString + ', true)\\">View all <svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 16 16\\"><path fill-rule=\\"evenodd\\" d=\\"M10.7071,7.29289 C11.0976,7.68342 11.0976,8.31658 10.7071,8.70711 L7.70711,11.7071 C7.31658,12.0976 6.68342,12.0976 6.29289,11.7071 C5.90237,11.3166 5.90237,10.6834 6.29289,10.2929 L8.58579,8 L6.29289,5.70711 C5.90237,5.31658 5.90237,4.68342 6.29289,4.29289 C6.68342,3.90237 7.31658,3.90237 7.70711,4.29289 L10.7071,7.29289 Z\\"/></svg></a></div>'
        }
        mb.window.webContents.executeJavaScript('document.getElementById("project-recent-mrs").innerHTML = "' + projectMRsString + '"')
    })
}

function displayCommit(commit, project, focus = 'project') {
    let logo = ''
    if (commit.last_pipeline) {
        logo += '<a target=\\"_blank\\" href=\\"' + commit.last_pipeline.web_url + '\\" class=\\"pipeline-link\\">'
        if (commit.last_pipeline.status == 'scheduled') {
            logo += '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"7\\"/><circle class=\\"icon\\" style=\\"fill: var(--svg-status-bg, #c9d1d9);\\" cx=\\"7\\" cy=\\"7\\" r=\\"6\\"/><g transform=\\"translate(2.75 2.75)\\" fill-rule=\\"nonzero\\"><path d=\\"M4.165 7.81a3.644 3.644 0 1 1 0-7.29 3.644 3.644 0 0 1 0 7.29zm0-1.042a2.603 2.603 0 1 0 0-5.206 2.603 2.603 0 0 0 0 5.206z\\"/><rect x=\\"3.644\\" y=\\"2.083\\" width=\\"1.041\\" height=\\"2.603\\" rx=\\".488\\"/><rect x=\\"3.644\\" y=\\"3.644\\" width=\\"2.083\\" height=\\"1.041\\" rx=\\".488\\"/></g></svg>'
        } else {
            logo += '<svg viewBox=\\"0 0 14 14\\" xmlns=\\"http://www.w3.org/2000/svg\\"><g fill-rule=\\"evenodd\\"><path d=\\"M0 7a7 7 0 1 1 14 0A7 7 0 0 1 0 7z\\" class=\\"icon\\"/><path d=\\"M13 7A6 6 0 1 0 1 7a6 6 0 0 0 12 0z\\" class=\\"icon-inverse\\" />'
            if (commit.last_pipeline.status == 'running') {
                logo += '<path d=\\"M7 3c2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.3 0-2.5-.7-3.3-1.7L7 7V3\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'failed') {
                logo += '<path d=\\"M7 5.969L5.599 4.568a.29.29 0 0 0-.413.004l-.614.614a.294.294 0 0 0-.004.413L5.968 7l-1.4 1.401a.29.29 0 0 0 .004.413l.614.614c.113.114.3.117.413.004L7 8.032l1.401 1.4a.29.29 0 0 0 .413-.004l.614-.614a.294.294 0 0 0 .004-.413L8.032 7l1.4-1.401a.29.29 0 0 0-.004-.413l-.614-.614a.294.294 0 0 0-.413-.004L7 5.968z\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'success') {
                logo += '<path d=\\"M6.278 7.697L5.045 6.464a.296.296 0 0 0-.42-.002l-.613.614a.298.298 0 0 0 .002.42l1.91 1.909a.5.5 0 0 0 .703.005l.265-.265L9.997 6.04a.291.291 0 0 0-.009-.408l-.614-.614a.29.29 0 0 0-.408-.009L6.278 7.697z\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'pending') {
                logo += '<path d=\\"M4.7 5.3c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H5c-.2 0-.3-.1-.3-.3V5.3m3 0c0-.2.1-.3.3-.3h.9c.2 0 .3.1.3.3v3.4c0 .2-.1.3-.3.3H8c-.2 0-.3-.1-.3-.3V5.3\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'canceled') {
                logo += '<path d=\\"M5.2 3.8l4.9 4.9c.2.2.2.5 0 .7l-.7.7c-.2.2-.5.2-.7 0L3.8 5.2c-.2-.2-.2-.5 0-.7l.7-.7c.2-.2.5-.2.7 0\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'skipped') {
                logo += '<path d=\\"M6.415 7.04L4.579 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L5.341 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L6.415 7.04zm2.54 0L7.119 5.203a.295.295 0 0 1 .004-.416l.349-.349a.29.29 0 0 1 .416-.004l2.214 2.214a.289.289 0 0 1 .019.021l.132.133c.11.11.108.291 0 .398L7.881 9.573a.282.282 0 0 1-.398 0l-.331-.331a.285.285 0 0 1 0-.399L8.955 7.04z\\" class=\\"icon\\"/></svg>'
            } else if (commit.last_pipeline.status == 'created') {
                logo += '<circle cx=\\"7\\" cy=\\"7\\" r=\\"3.25\\" class=\\"icon\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'preparing') {
                logo += '</g><circle cx=\\"7\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"10\\" cy=\\"7\\" r=\\"1\\"/><circle cx=\\"4\\" cy=\\"7\\" r=\\"1\\"/></g></svg>'
            } else if (commit.last_pipeline.status == 'manual') {
                logo += '<path d=\\"M10.5 7.63V6.37l-.787-.13c-.044-.175-.132-.349-.263-.61l.481-.652-.918-.913-.657.478a2.346 2.346 0 0 0-.612-.26L7.656 3.5H6.388l-.132.783c-.219.043-.394.13-.612.26l-.657-.478-.918.913.437.652c-.131.218-.175.392-.262.61l-.744.086v1.261l.787.13c.044.218.132.392.263.61l-.438.651.92.913.655-.434c.175.086.394.173.613.26l.131.783h1.313l.131-.783c.219-.043.394-.13.613-.26l.656.478.918-.913-.48-.652c.13-.218.218-.435.262-.61l.656-.13zM7 8.283a1.285 1.285 0 0 1-1.313-1.305c0-.739.57-1.304 1.313-1.304.744 0 1.313.565 1.313 1.304 0 .74-.57 1.305-1.313 1.305z\\" class=\\"icon\\"/></g></svg>'
            }
        }
    }
    logo += '</a>'
    let subline
    if (focus == 'project') {
        subline = '<a href=\\"' + project.web_url + '\\" target=\\_blank\\">' + escapeHtml(project.name_with_namespace) + '</a>'
    } else {
        subline = escapeHtml(commit.author_name)
    }
    return '<div class=\\"commit\\"><div class=\\"commit-information\\"><a href=\\"' + commit.web_url + '\\" target=\\"_blank\\">' + escapeHtml(commit.title) + '</a><span class=\\"namespace-with-time\\">' + timeSince(new Date(commit.committed_date)) + ' ago &middot; ' + subline + '</span></div>' + logo + '</div>'
}

function addBookmark(link) {
    let spinner = '<svg class=\\"button-spinner\\" xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 14 14\\"><g fill=\\"none\\" fill-rule=\\"evenodd\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"6\\" stroke=\\"#c9d1d9\\" stroke-opacity=\\".4\\" stroke-width=\\"2\\"/><path class=\\"icon\\" fill-opacity=\\".4\\" fill-rule=\\"nonzero\\" d=\\"M7 0a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V0z\\"/></g></svg>'
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-add-button").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-link").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-add-button").innerHTML = "' + spinner + ' Add"')
    if (link.indexOf(host + '') == 0 || link.indexOf('gitlab.com') == 0 || link.indexOf('http://gitlab.com') == 0) {
        parseGitLabUrl(link).then(bookmark => {
            if (!bookmark.type || (bookmark.type != 'issues' && bookmark.type != 'merge_requests' && bookmark.type != 'epics')) {
                displayAddError('bookmark', '-')
            } else {
                let bookmarks = store.get('bookmarks') || []
                bookmarks.push(bookmark)
                store.set('bookmarks', bookmarks)
                getBookmarks()
            }
        }).catch(error => {
            displayAddError('bookmark', '-')
        })
    } else {
        displayAddError('bookmark', '-')
    }
}

function addProject(link, target) {
    if (target == 'project-settings-link') {
        target = '-settings-'
    } else if (target == 'project-overview-link') {
        target = '-overview-'
    }
    let spinner = '<svg class=\\"button-spinner\\" xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 14 14\\"><g fill=\\"none\\" fill-rule=\\"evenodd\\"><circle cx=\\"7\\" cy=\\"7\\" r=\\"6\\" stroke=\\"#c9d1d9\\" stroke-opacity=\\".4\\" stroke-width=\\"2\\"/><path class=\\"icon\\" fill-opacity=\\".4\\" fill-rule=\\"nonzero\\" d=\\"M7 0a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V0z\\"/></g></svg>'
    mb.window.webContents.executeJavaScript('document.getElementById("project' + target + 'add-button").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("project' + target + 'link").disabled = "disabled"')
    mb.window.webContents.executeJavaScript('document.getElementById("project' + target + 'add-button").innerHTML = "' + spinner + ' Add"')
    if (link.indexOf(host + '') == 0 || link.indexOf('gitlab.com') == 0 || link.indexOf('http://gitlab.com') == 0) {
        parseGitLabUrl(link).then(project => {
            if (project.type && project.type != 'projects') {
                displayAddError('project', target)
            } else {
                let projects = store.get('favorite-projects') || []
                projects.push(project)
                store.set('favorite-projects', projects)
                if (target == '-settings-') {
                    openSettingsPage()
                }
                displayUsersProjects(projects)
            }
        }).catch(error => {
            displayAddError('project', target)
        })
    } else {
        displayAddError('project', target)
    }
}

function displayAddError(type, target) {
    mb.window.webContents.executeJavaScript('document.getElementById("add-' + type + target + 'error").style.display = "block"')
    mb.window.webContents.executeJavaScript('document.getElementById("add-' + type + target + 'error").innerHTML = "This is not a valid GitLab ' + type + ' URL."')
    mb.window.webContents.executeJavaScript('document.getElementById("' + type + target + 'add-button").disabled = false')
    mb.window.webContents.executeJavaScript('document.getElementById("' + type + target + 'link").disabled = false')
    mb.window.webContents.executeJavaScript('document.getElementById("' + type + target + 'add-button").innerHTML = "Add"')
}

function startBookmarkDialog() {
    let bookmarkLink = "'bookmark-link'"
    let bookmarkInput = '<form action=\\"#\\" id=\\"bookmark-input\\" onsubmit=\\"addBookmark(document.getElementById(' + bookmarkLink + ').value);return false;\\"><input id=\\"bookmark-link\\" placeholder=\\"Enter your link here...\\" /><button class=\\"add-button\\" id=\\"bookmark-add-button\\" type=\\"submit\\">Add</button></form><div id=\\"add-bookmark-error\\"></div>'
    mb.window.webContents.executeJavaScript('document.getElementById("add-bookmark-dialog").classList.add("opened")')
    mb.window.webContents.executeJavaScript('document.getElementById("add-bookmark-dialog").innerHTML = "' + bookmarkInput + '"')
    mb.window.webContents.executeJavaScript('window.scrollBy(0, 14)')
    mb.window.webContents.executeJavaScript('document.getElementById("bookmark-link").focus()')
}

function startProjectDialog() {
    let projectLink = "'project-settings-link'"
    let projectInput = '<form action=\\"#\\" class=\\"project-input\\" onsubmit=\\"addProject(document.getElementById(' + projectLink + ').value, ' + projectLink + ');return false;\\"><input class=\\"project-link\\" id=\\"project-settings-link\\" placeholder=\\"Enter the link to the project here...\\" /><button class=\\"add-button\\" id=\\"project-settings-add-button\\" type=\\"submit\\">Add</button></form><div class=\\"add-project-error\\" id=\\"add-project-settings-error\\"></div>'
    mb.window.webContents.executeJavaScript('document.getElementById("add-project-dialog").classList.add("opened")')
    mb.window.webContents.executeJavaScript('document.getElementById("add-project-dialog").innerHTML = "' + projectInput + '"')
    mb.window.webContents.executeJavaScript('window.scrollBy(0, 14)')
    mb.window.webContents.executeJavaScript('document.getElementById("project-settings-link").focus()')
}

async function parseGitLabUrl(link) {
    if (!/^(?:f|ht)tps?\:\/\//.test(link)) {
        link = "https://" + link;
    }
    let object = parse(link)
    let issuable
    if (object.type == 'issues' || object.type == 'merge_requests') {
        let result = await fetch(host + '/api/v4/projects/' + encodeURIComponent(object.namespaceWithProject) + '/' + object.type + '/' + object[object.type] + '?access_token=' + access_token)
        issuable = await result.json()
        let result2 = await fetch(host + '/api/v4/projects/' + issuable.project_id + '?access_token=' + access_token)
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
        let result = await fetch(host + '/api/v4/groups/' + encodeURIComponent(object.namespaceWithProject.replace('groups/', '')) + '/' + object.type + '/' + object[object.type])
        issuable = await result.json()
        let result2 = await fetch(host + '/api/v4/groups/' + issuable.group_id + '?access_token=' + access_token)
        let group = await result2.json()
        return {
            url: link,
            project: group.name,
            title: issuable.title,
            added: Date.now(),
            type: object.type,
            locationUrl: group.web_url
        }
    } else if (object.type == 'projects') {
        let result = await fetch(host + '/api/v4/projects/' + encodeURIComponent(object.namespaceWithProject) + '?access_token=' + access_token)
        let project = await result.json()
        return {
            id: project.id,
            visibility: project.visibility,
            web_url: project.web_url,
            name: project.name,
            namespace: {
                name: project.namespace.name
            },
            added: Date.now(),
            name_with_namespace: project.name_with_namespace,
            open_issues_count: project.open_issues_count,
            last_activity_at: project.last_activity_at,
            avatar_url: project.avatar_url,
            star_count: project.star_count,
            forks_count: project.forks_count,
            type: 'projects'
        }
    }
}

function parse(gitlabUrl) {
    if (typeof gitlabUrl !== 'string') {
        throw new Error('Expected gitLabUrl of type string')
    }
    const url = new URL(gitlabUrl)
    let path = url.pathname
    path = path.replace(/^\/|\/$/g, '')
    if (path.indexOf('/-/') != -1) {
        let pathArray = path.split('/-/')
        let object = {
            namespaceWithProject: pathArray[0],
            type: pathArray[1].split('/')[0]

        }
        object[object.type] = pathArray[1].split('/')[1].split('#')[0]
        return object
    } else {
        return {
            namespaceWithProject: path,
            type: 'projects'
        }
    }
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

function escapeQuotes(unsafe) {
    return unsafe.replace(/"/g, '\\"')
}

function timeSince(date, direction = 'since') {
    var seconds
    if(direction == 'since') {
        seconds = Math.floor((new Date() - date) / 1000);
    }else if(direction == 'to') {
        seconds = Math.floor((date - new Date()) / 1000);
    }
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
    interval = seconds / 604800;
    if (interval > 2) {
        return Math.floor(interval) + " weeks";
    } else if (interval > 1 && interval < 2) {
        return Math.floor(interval) + " week";
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

function displaySkeleton(count, pagination = false, id = 'detail-content') {
    let skeletonString = '<ul class=\\"list-container empty'
    if (pagination) {
        skeletonString += ' with-pagination\\">'
    } else {
        skeletonString += '\\">'
    }
    for (let i = 0; i < count; i++) {
        skeletonString += '<li class=\\"history-entry empty\\"><div class=\\"history-link skeleton\\"></div><div class=\\"history-details skeleton\\"></div></li>'
    }
    skeletonString += '</ul>'
    mb.window.webContents.executeJavaScript('document.getElementById("' + id + '").innerHTML = "' + skeletonString + '"')
}

function changeTheme(option = 'light', manual = false) {
    store.set('theme', option)
    if (option == 'light') {
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--background-color", "#fff")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--text-color", "#24292f")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--muted-text-color", "#57606a")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--placeholder-text-color", "#6e7781")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--panel-background-color", "#fff")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--hover-color", "#f6f8fa")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--dropdown-hover-color", "#f0f2f4")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--border-color", "#d0d7de")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--lighter-background-color", "#d8dee4")');
    } else if (option == 'dark') {
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--background-color", "#090c10")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--text-color", "#c9d1d9")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--muted-text-color", "#aaa")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--placeholder-text-color", "rgba(255, 255, 255, .7)")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--panel-background-color", "#0d1117")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--hover-color", "#161b22")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--dropdown-hover-color", "#1f242c")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--border-color", "#30363d")');
        mb.window.webContents.executeJavaScript('document.documentElement.style.setProperty("--lighter-background-color", "#21262d")');
    }
    if (manual) {
        mb.window.webContents.executeJavaScript('document.getElementById("light-mode").classList.remove("active")')
        mb.window.webContents.executeJavaScript('document.getElementById("dark-mode").classList.remove("active")')
        mb.window.webContents.executeJavaScript('document.getElementById("' + option + '-mode").classList.add("active")')
    }
}

function logout() {
    store.delete('user_id')
    store.delete('username')
    store.delete('access_token')
    store.delete('favorite-projects')
    store.delete('bookmarks')
    store.delete('host')
    store.delete('plan')
    store.delete('analytics')
    store.delete('analytics_id')
    mb.window.webContents.session.clearCache()
    mb.window.webContents.session.clearStorageData()
    app.quit()
    app.relaunch()
}
