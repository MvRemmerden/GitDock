const { menubar } = require('menubar')
const { Menu, net } = require("electron")

const mb = menubar({
    showDockIcon: false,
    showOnAllWorkspaces: false,
    icon: __dirname + '/assets/gitlab.png',
});

mb.on('ready', () => {
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: () => { mb.app.quit(); } }
    ])
    mb.tray.on('right-click', () => {
        mb.tray.popUpContextMenu(contextMenu)
    })

    const request = net.request(' https://gitlab.com/api/v4/users?username=mvanremmerden')
    request.on('response', (response) => {
        response.on('data', (chunk) => {
            console.log(JSON.parse(chunk)[0].id)
        })
        response.on('end', () => {
            console.log('No more data in response.')
        })
    })
    request.end()
});

mb.on('after-create-window', () => {
    mb.app.dock.hide();
    mb.window.openDevTools()
})
