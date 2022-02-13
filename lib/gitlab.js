const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { store } = require('./store');

const { DOMParser } = new JSDOM().window;

const serializeAndEscapeOptions = (options) => {
  const entries = options ? Object.entries(options) : [];
  if (entries.length === 0) {
    return '';
  }
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

module.exports = {
  /**
   * Fetch a resource from the GitLab instance.
   *
   * @param {string} what the resource, such as `groups` or `issues`
   * @param {object} options the GET options to append to the URL
   * @returns
   */
  async get(what, options = {}, host = store.host) {
    if (!options || !options.access_token) {
      options = {
        ...options,
        access_token: store.access_token,
      };
    }
    return fetch(`${host}/api/v4/${what}?${serializeAndEscapeOptions(options)}`).then((res) =>
      res.json(),
    );
  },
  async parseUrl(link) {
    if (!/^(?:f|ht)tps?\:\/\//.test(link)) {
      link = `https://${link}`;
    }

    const urlInfo = await this.fetchUrlInfo(link);

    // Have to late import because of circular dependency (GitLab.get)
    const parser = require('./url-parsers').createParserWithUrlInfo(urlInfo);

    return await parser.run(link);
  },
  async fetchUrlInfo(gitlabUrl) {
    if (typeof gitlabUrl !== 'string') {
      throw new Error('Expected gitLabUrl of type string');
    }

    const path = new URL(gitlabUrl).pathname.replace(/^\/|\/$/g, '').replace(/\+$/, '');

    if (path.includes('/-/')) {
      const [namespace, objectPath] = path.split('/-/');
      const [objectType, objectId] = objectPath.split('/');

      const object = {
        namespaceWithProject: namespace,
        type: objectType,
        doc: null,
        id: null,
      };

      if (['issues', 'merge_requests', 'epics', 'boards'].includes(object.type)) {
        object.id = objectId.split('#')[0];
      } else {
        const result = await fetch(gitlabUrl).then((res) => res.text());

        object.namespaceWithProject = path;
        object.type = 'unknown';
        object.doc = new DOMParser().parseFromString(result, 'text/html');
      }

      return object;
    }
    const result = await fetch(gitlabUrl).then((res) => res.text());
    const resultDocument = new DOMParser().parseFromString(result, 'text/html');

    let type = 'unknown';

    if (resultDocument.querySelector('.group-home-panel')) {
      type = 'groups';
    } else if (resultDocument.querySelector('.project-home-panel')) {
      type = 'projects';
    } else if (resultDocument.querySelector('.user-profile')) {
      type = 'users';
    }

    return {
      namespaceWithProject: path,
      type,
      id: null,
      doc: type === 'unknown' ? resultDocument : null,
    };
  },
  urlHasValidHost(url) {
    const allowedHosts = [String(store.host), 'gitlab.com', 'https://gitlab.com'];

    return allowedHosts.some((host) => url.startsWith(host));
  },
  commentToNoteableUrl(comment) {
    const basePath = `projects/${comment.project_id}`;
    switch (comment.note.noteable_type) {
      case 'MergeRequest':
        return `${basePath}/merge_requests/${comment.note.noteable_iid}`;
      case 'Issue':
        return `${basePath}/issues/${comment.note.noteable_iid}`;
      case 'Commit':
        return `${basePath}/repository/commits/${comment.note.position.head_sha}`;
      case 'Snippet':
        return `${basePath}/snippets/${comment.note.noteable_iid}`;
      case 'DesignManagement::Design':
        const iid = comment.note.position.new_path.split('/')[1].split('-')[1];
        return `${basePath}/issues/${iid}`;
      default:
        return null;
    }
  },
  indicatorForType(type) {
    switch (type) {
      case 'issues':
        return '#';
      case 'merge_requests':
        return '!';
      default:
        return '';
    }
  },
};
