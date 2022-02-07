if (!process.env.ACCESS_TOKEN) {
  console.error();

  console.error('  ✋ \x1b[33;1mAccess token required\x1b[0m');
  console.error();
  console.error('  A GitLab.com personal access token as an \x1b[92mACCESS_TOKEN\x1b[0m');
  console.error('  environment variable with the \x1b[92mread_api\x1b[0m scope is required');
  console.error('  to run the GitDock tests.');
  console.error();

  if (process.env.CI) {
    console.error('  In project forks, an \x1b[92mACCESS_TOKEN\x1b[0m CI/CD variable must be');
    console.error('  set for tests to be able to run for your merge requests.');
    console.error();
  }

  console.error('  See \x1b[92mCONTRIBUTING.md\x1b[0m for details and help.');
  console.error();
  process.exit(1);
}

module.exports = {
  extension: ['.spec.js'],
};
