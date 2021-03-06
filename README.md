# GitDock ⚓️

GitDock is a MacOS/Windows/Linux app that displays all your GitLab activities in one place. Instead of the GitLab typical project- or group-centric approach, it collects all your information from a user-centric perspective.

You can either have a look at this walkthrough video I recorded, or just try it out yourself by downloading it from the [releases](https://gitlab.com/mvanremmerden/gitdock/-/releases).

[![YouTube Video](/docs/img/youtube.png)](https://www.youtube.com/watch?v=WkVS38wo4_w 'GitDock ⚓️')

## Installation

As GitDock hasn't been digitally signed and verified (yet), the installation requires a few more steps than usual.

<details><summary>MacOS</summary>

### Installation options

Currently GitDock can be installed in 2 ways. Both currently require a workaround (explained right below the two options) in order for them to work:

#### Option 1: Homebrew

1. `brew install gitdock`

#### Option 2: Manual

1. Grab the dmg file from the newest release on the [Releases page](https://gitlab.com/mvanremmerden/gitdock/-/releases).
1. Move the app to your Applications folder and open it. You will see a notification informing you that this app hasn't been vetted and download from the App Store. Click "Cancel" at this point.

### Installation warning workaround

![Installation warning](/docs/img/installation-warning.png)

1. Open "Settings -> Security & Privacy" in your MacOS System Preferences, and make sure you are on the "General" tab.
1. You should now see a message about GitDock in the lower part. After clicking "Open anyway", it should work as expected 🎉

![Security & Privacy warning](/docs/img/security-privacy-warning.png)

</details>

<details><summary>Windows</summary>

1. Grab the `GitDock.exe` file from the newest release on the [Releases page](https://gitlab.com/mvanremmerden/gitdock/-/releases).
2. After the download has finished, Downloads will show a warning :warning: symbol, and will show a message _"Make sure you trust GitDock.exe"_.

3. Click the **"..."** next to the download item, and then choose **"Keep"**.

![Keep Download](/docs/img/windows-gitdock-keep-1.png)

4. Click **"Show more"**, and then choose **"Keep anyway"**.

![Keep Download](/docs/img/windows-gitdock-keep-2.png)

5. You will now have a "GitDock.exe" in your `Downloads` folder.
6. Click the "GitDock.exe" to open it. You will see a Windows Defender popup: _"Windows protected your PC"_

![Run GitDock](/docs/img/windows-gitdock-run-1.png)

7. Click **More Info**, then **Run anyway**.

![Run GitDock](/docs/img/windows-gitdock-run-2.png)

</details>

## How to use GitDock ⚓️

### Authentication

Depending on whether you use GitLab.com or a self-managed instance, you can either log in directly with your username and password, or create a personal access token.

<details><summary>GitLab.com</summary>

Just click the "Login with GitLab" button, and then enter your username and password. Afterwards, you might be seeing the GitLab homepage, but should very quickly and automatically be redirected to your GitDock overview page.

| Start                              | Login                              |
| ---------------------------------- | ---------------------------------- |
| ![Start page](/docs/img/start.png) | ![Login page](/docs/img/login.png) |

</details>

<details><summary>Self-managed installation</summary>

To log in with an account from a self-managed instance, you first have to create a personal access token:

Go to the Access Tokens page by first opening the user dropdown, clicking "Preferences" and then navigating to "Access tokens" in the left sidebar.

| User dropdown                             | Access tokens                                 |
| ----------------------------------------- | --------------------------------------------- |
| ![Preferences](/docs/img/preferences.png) | ![Access tokens](/docs/img/access-tokens.png) |

Enter a token name, mark the `read_api` checkbox and then click "Create personal access token". On the following screen, copy the newly created access token and paste it into the GitDock application, together with the URL of your self-managed instance.

</details>

### Notifications

#### Pipelines

Whenever you start a new pipeline, a system notification shows up and the GitDock icon in the menu bar changes to a running pipeline icon. Once the pipeline completes, you will receive another notification with the final pipeline status.

| Running                                             | Completed                                               |
| --------------------------------------------------- | ------------------------------------------------------- |
| ![Running pipeline](/docs/img/running-pipeline.png) | ![Completed pipeline](/docs/img/completed-pipeline.png) |

#### To-Dos

Whenever a new To-Do gets created for you, the system notification will show you the message, project and object where it's coming from.

![To-Do notification](/docs/img/todo-notification.png)

#### Configure notifications

Notifications can be configured and turned off through the notification
settings in your operating system.

- Windows: [Microsoft: Change notification settings in Windows][windows-notifications]
- macOS: [Use notifications on your Mac][mac-notifications]
- Linux (GNOME): [Notifications and the notification list][gnome-notifications]  
  Other desktop environments might have a similar menu in their
  settings. Check out the documentation of your’s for details.

[windows-notifications]: https://support.microsoft.com/en-us/windows/change-notification-settings-in-windows-8942c744-6198-fe56-4639-34320cf9444e
[mac-notifications]: https://support.apple.com/en-us/HT204079
[gnome-notifications]: https://help.gnome.org/users/gnome-help/stable/shell-notifications.html.en

### My Issues, MRs & To-Do list

At the top of the app, you will see the typical sections of issues, MRs and the To-Do list.

![Top section](/docs/img/top-section.png)

You might be used to this layout already from our GitLab UI. The only difference is that on the detail pages, you can more easily switch directly to the objects you care about by using the filters to e.g. see the last MRs you have approved and that have already been merged.

| Issues                          | MRs                                             | To-Do list                     |
| ------------------------------- | ----------------------------------------------- | ------------------------------ |
| ![Issues](/docs/img/issues.png) | ![Merge requests](/docs/img/merge-requests.png) | ![To-Dos](/docs/img/todos.png) |

### My commits

The first piece of content on the overview page is a list of your most recent commits. They show the commit title, project, and (if applicable) the current pipeline status for that commit. You can also navigate to each of these areas from that overview.

![My commits](/docs/img/my-commits.png)

### Recently viewed

GitDock uses your browser history to display the GitLab pages you most recently visited. Due to how it parses that information, it currently only works on Windows and MacOS with the following browsers: Chrome, Firefox, Edge, Opera, Brave, Seamonkey.

![Recently viewed](/docs/img/recently-viewed.png)

On the detail page, you can go over all pages you visited over the last 10 days, and also search for specific links, if you happen to remember a certain keyword.

![Recently viewed overview](/docs/img/recently-viewed-overview.png)

### Favorite projects

The list of your favorite projects initially are the projects you have starred and where you have at least developer permissions.

![Favorite projects](/docs/img/favorite-projects.png)

After navigating to a project in this overview, you will be able to see the commits, issues and merge requests of that project.

![Project detail](/docs/img/project-detail.png)

You can add/remove projects from this list on the Settings page.

![Project settings](/docs/img/project-settings.png)

### Your comments

A list of all your recent comments is also visible on the overview page. Due

![Comments](/docs/img/comments.png)

_The loading time for comments is significantly longer than for other objects, as each comment requires 3 API calls to collect all necessary information._

### Bookmarks

If you have a specific issue or merge request you care about and know you will have to access multiple times over the next days, you can add it to you Bookmarks list.

![Bookmarks](/docs/img/bookmarks.png)

### Settings

#### Theme

To make Gitdock as accessible and usable as possible, you can switch between dark and light theme.

| Dark                        | Light                         |
| --------------------------- | ----------------------------- |
| ![Dark](/docs/img/dark.png) | ![Light](/docs/img/light.png) |

#### Analytics

Analytics is disabled by default, you have the chance to opt in on the Settings page.

![Analytics](/docs/img/analytics.png)

## How to contribute

The most important part of contributing right now is helping us gain better insights into how users would like to navigate GitLab in this user-centric approach. That's why it would be amazing to have as many people as possible enable Analytics. As stated in the Settings, it's 100% anonymous and we only track which objects are being used to navigate around, now which specific content (e.g. issues, MRs) users are interacting with.

If you do find any bugs, feel free to open an issue or directly create a merge request if you happen to know the fix.
