const SimpleIssuableParser = require('./simple-issuable');
const ProjectParser = require('./project');
const GroupParser = require('./group');
const EpicParser = require('./epic');
const UserParser = require('./user');
const BoardParser = require('./board');
const UnknownParser = require('./unknown');

const parsers = [
  SimpleIssuableParser,
  ProjectParser,
  GroupParser,
  EpicParser,
  UserParser,
  BoardParser,
  UnknownParser,
];

module.exports = {
  createParserWithUrlInfo(urlInfo) {
    /* eslint-disable no-restricted-syntax */
    for (const Parser of parsers) {
      if (Parser.check(urlInfo.type)) {
        return new Parser(urlInfo);
      }
    }
    /* eslint-enable */

    throw new Error('Unknown');
  },
};
