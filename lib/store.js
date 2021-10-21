const ElectronStore = require('electron-store');
const { v4: uuidv4 } = require('uuid');

const defaults = {
  host: 'https://gitlab.com',
  plan: 'free',
  analytics: false,
  analytics_id: uuidv4(),
};

const store = new ElectronStore();

const proxy = new Proxy(store, {
  get(target, key) {
    return target.get(key) || defaults[key];
  },
  set(target, key, value) {
    target.set(key, value);
  },
});

proxy.analytics_id = proxy.analytics_id || defaults.analytics_id;

module.exports = {
  store: proxy,
  deleteFromStore: (key) => store.delete(key),
};
