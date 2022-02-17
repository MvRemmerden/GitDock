const GitLab = require('../gitlab');

module.exports = class BaseParser {
  constructor(urlInfo) {
    this.urlInfo = urlInfo;
  }

  static check() {
    throw Error(`static ${this.constructor.name}#check(type) is not implemented`);
  }

  async parse() {
    throw Error(`async ${this.constructor.name}#parse(meta) is not implemented`);
  }

  get escapedNamespace() {
    // eslint-disable-next-line prefer-const
    let { namespaceWithProject, type } = this.urlInfo;

    if (type === 'epics') {
      namespaceWithProject = namespaceWithProject.replace('groups/', '');
    }

    return encodeURIComponent(namespaceWithProject);
  }

  async fetchIssuable(type = 'projects') {
    return GitLab.get(`${type}/${this.escapedNamespace}/${this.urlInfo.type}/${this.urlInfo.id}`);
  }

  async run(link) {
    const baseObject = await this.parse();

    return {
      added: Date.now(),
      type: this.urlInfo.type,
      web_url: link,

      ...baseObject,
    };
  }
};
