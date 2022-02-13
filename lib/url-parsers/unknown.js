const { store } = require('../store');
const BaseParser = require('./_base');

module.exports = class UnknownParser extends BaseParser {
  static check(type) {
    return type === 'unknown';
  }

  async parse() {
    const { doc } = this.urlInfo;

    const titleArray = doc.querySelector('title').text.split(' · ');
    const unknownObject = {
      title: titleArray[0],
    };
    if (doc.querySelector('.context-header a')) {
      unknownObject.parent_url =
        store.host + doc.querySelector('.context-header a').getAttribute('href');
      if (titleArray.length === 3) {
        unknownObject.parent_name = titleArray[1];
      } else if (titleArray.length === 4) {
        unknownObject.parent_name = titleArray[2];
      }
    }
    return unknownObject;
  }
};
