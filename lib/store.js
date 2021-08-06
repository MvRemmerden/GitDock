const ElectronStore = require('electron-store')
const uuid = require('uuid/v4')

const defaults = {
  host: 'https://gitlab.com',
  plan: 'free',
  analytics: false,
  analytics_id: uuid()
}

const proxy = new Proxy(new ElectronStore(), {
  get(store, key) {
    return store.get(key) || defaults[key];
  },
  set(target, key, value) {
    target.set(key, value)
  }
})

proxy.analytics_id = proxy.analytics_id || defaults.analytics_id

module.exports = proxy