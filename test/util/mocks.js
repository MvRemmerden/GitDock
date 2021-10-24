/*
 * This file contains the mock registry
 * to register mocked local dependencies
 * and the logic to replace them during
 * tests.
 */

// Register mocks here 👇
//  ◀️ Left side is the dependency (absolute from project root)
//  ▶️ Right side is relative from current directory

const mockRegistry = {
  '/lib/store.js': '__mocks__/store.js',
  '/lib/process-info.js': '__mocks__/process-info.js',
  '/node_modules/node-browser-history/index.js': '__mocks__/node-browser-history.js',
};

// Below is the dependency replace logic

const path = require('path');
const nodeRequire = require.extensions['.js'];

const PROJECT_ROOT = path.join(__dirname, '..', '..');

require.extensions['.js'] = function (module, filename) {
  const moduleId = filename.replace(PROJECT_ROOT, '');

  if (moduleId in mockRegistry) {
    const mockedModulePath = path.join(__dirname, mockRegistry[moduleId]);

    return nodeRequire.apply(this, [module, mockedModulePath]);
  }

  // fallback to native require() implementation
  return nodeRequire.apply(this, arguments);
};
