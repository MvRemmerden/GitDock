const GitLab = require('../gitlab');
const BaseParser = require('./_base');

module.exports = class GroupParser extends BaseParser {
  static check(type) {
    return type === 'groups';
  }

  async parse() {
    const group = await GitLab.get(`groups/${this.escapedNamespace}`);

    const groupObject = {
      id: group.id,
      visibility: group.visibility,
      web_url: group.web_url,
      title: group.name,
      name: group.name,
      namespace: {
        name: group.name,
      },
      name_with_namespace: group.name_with_namespace,
      avatar_url: group.avatar_url,
    };

    if (group.full_name.indexOf(' / ' + group.name) != -1) {
      groupObject.parent_name = group.full_name.replace(' / ' + group.name, '');
      groupObject.parent_url = group.web_url.replace('/' + group.path, '');
    }

    return groupObject;
  }
};
