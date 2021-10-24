module.exports = {
  async getAllHistory() {
    try {
      return JSON.parse(process.env.MOCK_BROWSER_HISTORY);
    } catch (error) {
      return [];
    }
  },
};
