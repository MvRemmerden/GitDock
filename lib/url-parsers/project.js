const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class ProjectParser extends BaseParser {
  static check(type) {
    return type === 'projects';
  }

  async parse() {
    const project = await GitLab.get(`projects/${this.escapedNamespace}`);

    return {
      id: project.id,
      visibility: project.visibility,
      web_url: project.web_url,
      name: project.name,
      title: project.name,
      namespace: {
        name: project.namespace.name,
      },
      parent_name: project.name_with_namespace,
      parent_url: project.namespace.web_url,
      name_with_namespace: project.name_with_namespace,
      open_issues_count: project.open_issues_count,
      last_activity_at: project.last_activity_at,
      avatar_url: project.avatar_url,
      star_count: project.star_count,
      forks_count: project.forks_count,
    };
  }
};
