const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class EpicParser extends BaseParser {
  static check(type) {
    return type === 'epics';
  }

  async parse() {
    const issuable = await this.fetchIssuable('groups');
    const group = await GitLab.get(`groups/${issuable.group_id}`);

    return {
      parent_name: group.full_name,
      title: issuable.title,
      parent_url: group.web_url,
    };
  }
};
