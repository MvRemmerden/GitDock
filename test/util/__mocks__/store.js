const { v4: uuidv4 } = require('uuid');

const defaults = {
  host: 'https://gitlab.com',
  plan: 'free',
  analytics: false,
  analytics_id: uuidv4(),
  theme: 'dark',
  shortcuts: ['CommandOrControl+Option+G', 'CommandOrControl+Option+P'],
  keep_visible: false,
  show_dock_icon: true,
};

const store = JSON.parse(process.env.MOCK_STORE || '{}');

const proxy = new Proxy(store, {
  get(target, key) {
    if (target[key] == undefined) {
      return defaults[key];
    } else {
      return target[key];
    }
  },
  set(target, key, value) {
    target[key] = value;
  },
});

proxy.analytics_id = proxy.analytics_id || defaults.analytics_id;

module.exports = {
  store: proxy,
  deleteFromStore: (key) => {
    delete store[key];
  },
};
