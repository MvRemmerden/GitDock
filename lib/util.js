const { createHash } = require('crypto');

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/`/g, '&#039;')
    .replace(/'/g, '&#039;')
    .replace(/@/g, '&commat;')
    .replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t');
}

function escapeQuotes(unsafe) {
  return unsafe.replace(/"/g, '\\"');
}

function escapeSingleQuotes(unsafe) {
  return unsafe.replace(/'/g, "\\'");
}

function sha256hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

module.exports = {
  escapeHtml,
  escapeQuotes,
  escapeSingleQuotes,
  sha256hex,
};
