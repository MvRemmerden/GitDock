const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class UserParser extends BaseParser {
  static check(type) {
    return type === 'users';
  }

  async parse() {
    const { namespaceWithProject } = this.urlInfo;

    const [user] = await GitLab.get('users', {
      username: namespaceWithProject,
    });

    return {
      title: user.name,
      web_url: user.web_url,
    };
  }
};
