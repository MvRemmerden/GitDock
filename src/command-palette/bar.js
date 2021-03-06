/* eslint no-undef: 0 */
const $search = document.querySelector('input');
const $results = document.querySelector('#results');
let html = [];
let $selected = 0;
const mrIcon =
  '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.34 1.22a.75.75 0 0 0-1.06 0L7.53 2.97 7 3.5l.53.53 1.75 1.75a.75.75 0 1 0 1.06-1.06l-.47-.47h.63c.69 0 1.25.56 1.25 1.25v4.614a2.501 2.501 0 1 0 1.5 0V5.5a2.75 2.75 0 0 0-2.75-2.75h-.63l.47-.47a.75.75 0 0 0 0-1.06ZM13.5 12.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 0a2.5 2.5 0 1 1-3.25-2.386V5.886a2.501 2.501 0 1 1 1.5 0v4.228A2.501 2.501 0 0 1 6 12.5Zm-1.5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';
const issueIcon =
  '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 2.5h6a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5ZM1 3a2 2 0 0 1 2-2h6a2 2 0 0 1 1.97 1.658l2.913 1.516a1.75 1.75 0 0 1 .744 2.36l-3.878 7.45a.753.753 0 0 1-.098.145c-.36.526-.965.871-1.651.871H3a2 2 0 0 1-2-2V3Zm10 7.254 2.297-4.413a.25.25 0 0 0-.106-.337L11 4.364v5.89Z"/></svg>';
const projectIcon =
  '<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="m9.5 14.5-6-2.5V4l6-2.5v13Zm-6.885-1.244A1 1 0 0 1 2 12.333V3.667a1 1 0 0 1 .615-.923L8.923.115A1.5 1.5 0 0 1 11 1.5V2h1.25c.966 0 1.75.783 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 14H11v.5a1.5 1.5 0 0 1-2.077 1.385l-6.308-2.629ZM11 12.5h1.25a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H11v9Z"/></svg>';

let ALL_FAVORITES = gitdock.getFavorites() || [];
let ALL_BOOKMARKS = gitdock.getBookmarks() || [];
let ALL_RECENTS = gitdock.getRecents() || [];

const ALL_ACTIONS = {
  newProject: {
    title: 'New project',
    icon: projectIcon,
    execute() {
      gitdock.openGitLab('/projects/new');
    },
  },
  newGroup: {
    title: 'New group',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm1.5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>',
    execute() {
      gitdock.openGitLab('/groups/new');
    },
  },
  newSnippet: {
    title: 'New snippet',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.625.1A.75.75 0 0 1 4.65.375L8 6.177 11.35.375a.75.75 0 1 1 1.3.75L8.864 7.677l1.97 3.412A2.503 2.503 0 0 1 14 13.5a2.5 2.5 0 1 1-4.425-1.595L7.999 9.176l-.26.45a.75.75 0 0 1-1.298-.751l.692-1.199L3.35 1.125A.75.75 0 0 1 3.625.1ZM5.5 13.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm5.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    execute() {
      gitdock.openGitLab('/-/snippets/new');
    },
  },
};

const ALL_OVERVIEWS = {
  overviewTodos: {
    title: 'To-Do list',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 13.5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h9.25a.75.75 0 0 0 0-1.5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.75a.75.75 0 0 0-1.5 0V13a.5.5 0 0 1-.5.5H3Zm12.78-8.82a.75.75 0 0 0-1.06-1.06L9.162 9.177 7.289 7.241a.75.75 0 1 0-1.078 1.043l2.403 2.484a.75.75 0 0 0 1.07.01L15.78 4.68Z"/></svg>',
    execute() {
      gitdock.openGitLab('/dashboard/todos');
    },
  },
  overviewAssignedIssues: {
    title: 'Issues',
    icon: issueIcon,
    execute() {
      const username = encodeURIComponent(gitdock.getUsername());
      gitdock.openGitLab(`/dashboard/issues?scope=all&state=opened&assignee_username=${username}`);
    },
  },
  overviewAssignedMRs: {
    title: 'Merge requests',
    icon: mrIcon,
    execute() {
      const username = encodeURIComponent(gitdock.getUsername());
      gitdock.openGitLab(
        `/dashboard/merge_requests?scope=all&state=opened&assignee_username=${username}`,
      );
    },
  },
  overviewMRsToReview: {
    title: 'Review requests',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 0a2.5 2.5 0 0 1 2.45 2H13a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.55A2.5 2.5 0 0 1 8 0ZM7 5h3.5V3.5h2v11h-9v-11h2V5H7Zm3.53 3.28a.75.75 0 1 0-1.06-1.06L7.5 9.19l-.47-.47a.75.75 0 0 0-1.06 1.06l1 1a.75.75 0 0 0 1.06 0l2.5-2.5Z"/></svg>',
    execute() {
      const username = encodeURIComponent(gitdock.getUsername());
      gitdock.openGitLab(`/dashboard/merge_requests?reviewer_username=${username}`);
    },
  },
};

const ALL_FEEDBACKS = {
  feedbackNew: {
    title: 'Report a bug or suggest improvements',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3.25a.75.75 0 0 0 0-1.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v5.25a.75.75 0 0 0 1.5 0V4.364l2.19 1.14a.25.25 0 0 1 .107.338l-1.072 2.062a.75.75 0 0 0 1.33.692l1.073-2.062a1.75 1.75 0 0 0-.745-2.36l-2.912-1.516A2 2 0 0 0 9 1H3Zm6 12a.75.75 0 0 1 .75-.75h1.5v-1.5a.75.75 0 0 1 1.5 0v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5A.75.75 0 0 1 9 13Z"/></svg>',
    execute() {
      gitdock.openGitLab('/mvanremmerden/gitdock/-/issues/new');
    },
  },
  feedbackIssues: {
    title: 'Open issues for GitDock',
    icon: '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 2.5h6a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5ZM1 3a2 2 0 0 1 2-2h6a2 2 0 0 1 1.97 1.658l2.913 1.516a1.75 1.75 0 0 1 .744 2.36l-3.878 7.45a.753.753 0 0 1-.098.145c-.36.526-.965.871-1.651.871H3a2 2 0 0 1-2-2V3Zm10 7.254 2.297-4.413a.25.25 0 0 0-.106-.337L11 4.364v5.89Z"/></svg>',
    execute() {
      gitdock.openGitLab('/mvanremmerden/gitdock/-/issues');
    },
  },
};

function matcher({ title }) {
  let lowerCaseTitle = title.toLowerCase();
  const searchTerm = $search.value;
  const terms = searchTerm.toLowerCase().split(' ').filter(Boolean);

  let matchCount = 1;

  /* eslint-disable no-restricted-syntax */
  for (const term of terms) {
    matchCount += lowerCaseTitle.split(' ').filter((x) => x.includes(term)).length;
    const newTitle = lowerCaseTitle.replace(term, '');
    if (newTitle === lowerCaseTitle) {
      return false;
    }
    lowerCaseTitle = newTitle;
  }
  /* eslint-enable */

  return matchCount;
}

function loadActions() {
  const actions = Object.entries(ALL_ACTIONS);

  return [...actions]
    .filter(([, action]) => matcher(action))
    .sort(([, actionA], [, actionB]) => matcher(actionB) - matcher(actionA));
}

function loadOverviews() {
  const overviews = Object.entries(ALL_OVERVIEWS);

  return [...overviews]
    .filter(([, overview]) => matcher(overview))
    .sort(([, overviewA], [, overviewB]) => matcher(overviewB) - matcher(overviewA));
}

function loadFeedbacks() {
  const feedbacks = Object.entries(ALL_FEEDBACKS);

  return [...feedbacks]
    .filter(([, feedback]) => matcher(feedback))
    .sort(([, feedbackA], [, feedbackB]) => matcher(feedbackB) - matcher(feedbackA));
}

function loadFavorites() {
  const favorites = ALL_FAVORITES.map((favorite) => [
    `open-favorite::${favorite.id}`,
    {
      title: `${favorite.name}`,
      avatar_url: favorite.visibility === 'public' ? favorite.avatar_url : null,
    },
  ]);

  return [...favorites]
    .filter(([, favorite]) => matcher(favorite))
    .sort(([, favoriteA], [, favoriteB]) => matcher(favoriteB) - matcher(favoriteA));
}

function loadBookmarks() {
  const bookmarks = ALL_BOOKMARKS.map((bookmark) => [
    `open-bookmark::${bookmark.added}`,
    {
      title: `${bookmark.title}`,
      type: `${bookmark.type}`,
    },
  ]);

  return [...bookmarks]
    .filter(([, bookmark]) => matcher(bookmark))
    .sort(([, bookmarkA], [, bookmarkB]) => matcher(bookmarkB) - matcher(bookmarkA));
}

function loadRecents() {
  const recents = ALL_RECENTS.map((recent) => [
    `open-recent::${new Date(recent.utc_time).getTime()}`,
    {
      title: `${recent.title}`,
      type: `${recent.type}`,
    },
  ]);

  return [...recents]
    .filter(([, recent]) => matcher(recent))
    .sort(([, recentA], [, recentB]) => matcher(recentB) - matcher(recentA));
}

function changeTheme() {
  if (gitdock.getTheme() === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (gitdock.getTheme() === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function changeHighlight(i) {
  document.getElementById(`item-${$selected}`)?.classList.remove('selected');
  document.getElementById(`item-${i}`).classList.add('selected');
  $selected = i;
}

function search() {
  html = [];
  let i = 0;

  ALL_FAVORITES = gitdock.getFavorites() || [];
  ALL_BOOKMARKS = gitdock.getBookmarks() || [];
  ALL_RECENTS = gitdock.getRecents() || [];

  const availableActions = loadActions();
  const availableOverviews = loadOverviews();
  const availableFeedbacks = loadFeedbacks();
  const availableFavorites = loadFavorites();
  const availableBookmarks = loadBookmarks();
  const availableRecents = loadRecents();

  if (availableOverviews.length > 0) {
    html.push('<h5>Overview</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableOverviews) {
      const icon = action.icon ? `${action.icon}` : '';
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${icon}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
  }

  if (availableFavorites.length > 0) {
    html.push('<h5>Favorite projects</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableFavorites) {
      const avatar = action.avatar_url ? `<img src="${action.avatar_url}" />` : projectIcon;
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${avatar}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
    /* eslint-enable */
  }

  if (availableBookmarks.length > 0) {
    html.push('<h5>Bookmarks</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableBookmarks) {
      let icon;
      if (action.type === 'issues') {
        icon = issueIcon;
      } else if (action.type === 'merge_requests') {
        icon = mrIcon;
      } else {
        icon =
          '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.747 9.441a.611.611 0 0 0 .224-.682l-.896-2.755-1.277-3.931-.14-.434-.06-.186-.226-.695-.003-.007-.068-.211a.307.307 0 0 0-.582 0l-.068.21-.003.008-.226.696-.06.185-.14.433-1.277 3.929H5.052L3.777 2.074l-.142-.435-.062-.19L3.35.755 3.347.75 3.278.54a.306.306 0 0 0-.58 0l-.07.21-.001.006-.224.691-.062.192-.141.435L.926 6.001.03 8.759a.61.61 0 0 0 .22.682L8 15.071l7.747-5.63Zm-7.748 3.776 6.345-4.61-.696-2.139L13.01 4.5l-.638 1.963A1.5 1.5 0 0 1 10.945 7.5H5.052a1.5 1.5 0 0 1-1.427-1.037l-.636-1.96-.636 1.96-.697 2.144L8 13.218Z"/></svg>';
      }
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${icon}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
    /* eslint-enable */
  }

  if (availableRecents.length > 0) {
    html.push('<h5>Recently viewed</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableRecents) {
      let icon;
      if (action.type === 'issues') {
        icon = issueIcon;
      } else if (action.type === 'merge_requests') {
        icon = mrIcon;
      } else {
        icon =
          '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.747 9.441a.611.611 0 0 0 .224-.682l-.896-2.755-1.277-3.931-.14-.434-.06-.186-.226-.695-.003-.007-.068-.211a.307.307 0 0 0-.582 0l-.068.21-.003.008-.226.696-.06.185-.14.433-1.277 3.929H5.052L3.777 2.074l-.142-.435-.062-.19L3.35.755 3.347.75 3.278.54a.306.306 0 0 0-.58 0l-.07.21-.001.006-.224.691-.062.192-.141.435L.926 6.001.03 8.759a.61.61 0 0 0 .22.682L8 15.071l7.747-5.63Zm-7.748 3.776 6.345-4.61-.696-2.139L13.01 4.5l-.638 1.963A1.5 1.5 0 0 1 10.945 7.5H5.052a1.5 1.5 0 0 1-1.427-1.037l-.636-1.96-.636 1.96-.697 2.144L8 13.218Z"/></svg>';
      }
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${icon}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
    /* eslint-enable */
  }

  if (availableActions.length > 0) {
    html.push('<h5>Actions</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableActions) {
      const icon = action.icon ? `${action.icon}` : '';
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${icon}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
    /* eslint-enable */
  }

  if (availableFeedbacks.length > 0) {
    html.push('<h5>GitDock</h5>');

    /* eslint-disable no-restricted-syntax */
    for (const [key, action] of availableFeedbacks) {
      const icon = action.icon ? `${action.icon}` : '';
      html.push(
        `<li id="item-${i}" class="${
          i === $selected ? 'selected' : ''
        }" data-action="${key}" onclick="handleClick(this)" onmouseover="changeHighlight(${i})" tabindex="0">${icon}
          <div class="action-title">${action.title}</div>
        </li>`,
      );
      i += 1;
    }
  }

  $results.innerHTML = html.join('\n');
  changeHighlight(0);
  changeTheme();
}

const hide = () => {
  gitdock.hideCommandPalette();
  $search.value = '';
  search();
};

function hideCursor() {
  document.querySelector('body').style.cursor = 'none';
  document.getElementById('mouseoverDisabler').style.display = 'block';
}

let lastClick = Date.now();

// eslint-disable-next-line no-unused-vars
function handleClick(target) {
  if (Date.now() - lastClick < 500) {
    return;
  }
  lastClick = Date.now();
  const key = target.getAttribute('data-action');

  if (key.startsWith('open-favorite::')) {
    const favoriteId = parseInt(key.split('::')[1], 10);
    const webUrl = ALL_FAVORITES.find((favorite) => favorite.id === favoriteId).web_url;
    gitdock.openGitLab(webUrl);
  } else if (key.startsWith('open-bookmark::')) {
    const bookmarkAdded = parseInt(key.split('::')[1], 10);
    const webUrl = ALL_BOOKMARKS.find((bookmark) => bookmark.added === bookmarkAdded).web_url;
    gitdock.openGitLab(webUrl);
  } else if (key.startsWith('open-recent::')) {
    const recentVisited = parseInt(key.split('::')[1], 10);
    const { url } = ALL_RECENTS.find(
      (recent) => new Date(recent.utc_time).getTime() === recentVisited,
    );
    gitdock.openGitLab(url);
  } else if (key.startsWith('new')) {
    ALL_ACTIONS[key].execute();
  } else if (key.startsWith('overview')) {
    ALL_OVERVIEWS[key].execute();
  } else if (key.startsWith('feedback')) {
    ALL_FEEDBACKS[key].execute();
  }

  setTimeout(() => {
    hide();
  }, 10);
}

$search.addEventListener('input', search);

search();

document.getElementById('search').addEventListener('keydown', (e) => {
  if (e.which === 38 || e.which === 40) {
    e.preventDefault();
  }
});

function scroll(element, up) {
  hideCursor();
  let top;
  if (up) {
    top = element.offsetTop - 89;
  } else {
    top = element.offsetTop - (window.innerHeight - 89);
  }
  if (element.getBoundingClientRect().top < 89) {
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  }
  if (element.getBoundingClientRect().bottom > window.innerHeight - 40) {
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  }
}

document.addEventListener('keydown', (x) => {
  if (x.key === 'Escape') {
    hide();
  } else {
    switch (x.keyCode) {
      case 13:
        document.getElementById(`item-${$selected}`).click();
        break;
      case 38:
        if ($selected > 0) {
          changeHighlight($selected - 1);
          scroll(document.querySelector('ul').querySelectorAll('li')[$selected], true);
        } else {
          changeHighlight(html.filter((item) => item.indexOf('<li') !== -1).length - 1);
          scroll(document.querySelector('ul').querySelectorAll('li')[$selected], false);
        }
        break;
      case 40:
        if (document.getElementById(`item-${$selected + 1}`)) {
          changeHighlight($selected + 1);
          scroll(document.querySelector('ul').querySelectorAll('li')[$selected], false);
        } else {
          changeHighlight(0);
          scroll(document.querySelector('ul').querySelectorAll('li')[$selected], true);
        }
        break;
      default:
        break;
    }
  }
});

document.addEventListener('mousemove', () => {
  document.querySelector('body').style.cursor = 'auto';
  document.getElementById('mouseoverDisabler').style.display = 'none';
});

window.addEventListener('blur', () => {
  search();
});

window.addEventListener('focus', () => {
  search();
});
