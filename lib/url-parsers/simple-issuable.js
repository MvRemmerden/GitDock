const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class SimpleIssuableParser extends BaseParser {
  static check(type) {
    return type === 'issues' || type === 'merge_requests';
  }

  async parse() {
    const issuable = await this.fetchIssuable();
    const project = await GitLab.get(`projects/${issuable.project_id}`);

    return {
      parent_name: project.name_with_namespace,
      project: project.name,
      title: issuable.title,
      parent_url: project.web_url,
      id: issuable.iid,
    };
  }
};
