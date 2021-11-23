const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class BoardParser extends BaseParser {
  static check(type) {
    return type === 'issues' || type === 'merge_requests';
  }

  async parse() {
    const board = await GitLab.get(`projects/${this.escapedNamespace}/boards/${this.urlInfo.id}`);

    return {
      parent_name: board.project.name_with_namespace,
      title: board.name,
      parent_url: board.project.web_url,
    };
  }
};
