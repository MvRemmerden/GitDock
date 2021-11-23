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
    for (const parser of parsers) {
      if (parser.check(urlInfo.type)) {
        return new parser(urlInfo);
      }
    }

    throw new Error('Unknown');
  },
};
