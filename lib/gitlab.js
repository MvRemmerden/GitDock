const fetch = require('node-fetch');
const { store } = require('./store');

const serializeAndEscapeOptions = (options) => {
  const entries = options ? Object.entries(options) : [];
  if (entries.length === 0) {
    return '';
  }
  return entries.map(([key, value]) => `${key}=${value}`).join('&');
};

module.exports = {
  /**
   * Fetch a resource from the GitLab instance.
   *
   * @param {string} what the resource, such as `groups` or `issues`
   * @param {object} options the GET options to append to the URL
   * @returns
   */
  async get(what, options = {}) {
    if (!options || !options.access_token) {
      options = { ...options, access_token: store.access_token };
    }
    return fetch(`${store.host}/api/v4/${what}?${serializeAndEscapeOptions(options)}`).then((res) =>
      res.json(),
    );
  },
};
