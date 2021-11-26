# Contributing to GitDock

Thank you for your interest in contributing to GitDock!

We believe that [everyone can contribute][gitlab-mission].

[gitlab-mission]: https://about.gitlab.com/company/mission/

## Reporting bugs & proposing features

We use issues to collect bugs, feature requests, and more. You can
[browse through existing issues][issues]. To report a bug, suggest an
improvement, or propose a feature, please
[create a new issue][new-issue] if there is not already an issue for it.

[issues]: https://gitlab.com/mvanremmerden/gitdock/-/issues
[new-issue]: https://gitlab.com/mvanremmerden/gitdock/-/issues/new

## Contributing code

GitDock is built on the [electron] framework which makes it easy to
build desktop apps with JavaScript and HTML.

[electron]: https://www.electronjs.org/

### 1. Fork & clone the project

Before you can start contributing code, please [fork][fork] this project
to your GitLab account.

If you have not yet installed git, read [this guide][git] and install
git to your local machine. Alternatively, you can use [Gitpod][gitpod]
to develop in the cloud.

If you decide to work on your local system, [clone the project][clone].

[fork]: https://docs.gitlab.com/ee/gitlab-basics/start-using-git.html#fork
[git]: https://docs.gitlab.com/ee/topics/git/how_to_install_git/index.html
[gitpod]: https://docs.gitlab.com/ee/integration/gitpod.html#gitpod-integration
[clone]: https://docs.gitlab.com/ee/gitlab-basics/start-using-git.html#clone-a-repository

### 2. Install dependencies

GitDock requires Node.js to be installed. If you don’t have it
installed, please do it now. You can find binaries and installers on the
official [Node.js download page](https://nodejs.org/en/download/).

After you have cloned your fork, open a terminal in the directory. Use
`npm install` to install all Node.js dependencies.

### 3. Start making changes

You can start GitDock with `npm start`. After a few seconds, the GitDock
window should appear. If it does, congrats! 🎉

You can now start making changes. Except when you edit `.html` files, you
have to quit GitDock and restart it with `npm start` to see your changes
in effect.

### 4. Open a merge request

When you’d like to get feedback on your changes or are satisfied with
them, push the changes to a new branch and open a [merge request][mr].

[mr]: https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html#when-you-work-in-a-fork

## Running tests

At the moment, tests need a GitLab.com [Personal Access Token][pat]
(access token) to pass. The reason for that constraint is that some
tests will load data from the GitLab.com API. This is more
time-efficient than mocking all API responses and—because this project
is affiliated with GitLab—, it helps find problems with the GitLab API.

After you have created a personal access token, you can run the tests
with the following command. Let’s suppose `gpat-1234` is your access
token:

```bash
ACCESS_TOKEN="gpat-1234" npm test
```

The progress of removing this constraint, at least for forks, is tracked
in [its own issue][i54].

[api-token-req]: https://gitlab.com/mvanremmerden/gitdock/-/merge_requests/43#note_735062794
[i54]: https://gitlab.com/mvanremmerden/gitdock/-/issues/54

### Pipelines in forks

The above mentioned contraint of requiring a GitLab.com access token
applies to pipelines as well. You have to create a new CI variable in
your fork project. Follow [this guide][ci-variable] but keep **Protect
variable** unchecked and, to prevent leaking your access token, check
the **Mask variable** checkbox.

[pat]: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
[ci-variable]: https://docs.gitlab.com/ee/ci/variables/#add-a-cicd-variable-to-a-project

## Pull mirroring in your fork

The `main` branch of your fork repository will not automatically stay
updated with the `main` branch of the original GitDock repository. If
you don’t want to update your `main` branch manually, you can enable
[repository mirroring][repo-mirror] from the main GitDock repository to
your fork.

[repo-mirror]: https://docs.gitlab.com/ee/user/project/repository/forking_workflow.html#repository-mirroring
