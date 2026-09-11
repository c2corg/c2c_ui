/*
 * LocalStorage is a wrapper arround window.localStorage
 * it allows a key/string to be used as a key/{property:value} object
 */

function LocalStorageItem(key) {
  this.key = key;
  try {
    this.data_ = JSON.parse(window.localStorage.getItem(key) ?? '{}');
  } catch (err) {
    this.data_ = {};
  }
}

LocalStorageItem.prototype.commit_ = function () {
  window.localStorage.setItem(this.key, JSON.stringify(this.data_));
};

LocalStorageItem.prototype.get = function (propertyName, defaultIfUndefined) {
  const result = this.data_[propertyName];
  return result === undefined ? defaultIfUndefined : result;
};

LocalStorageItem.prototype.set = function (propertyName, value) {
  // deep copy of value
  value = JSON.parse(JSON.stringify(value));

  this.data_[propertyName] = value;
  this.commit_();
};

LocalStorageItem.prototype.clear = function () {
  this.data_ = {};
  this.commit_();
};

LocalStorageItem.prototype.initialize = function (data) {
  this.data_ = Object.assign({}, data);
  this.commit_();
};

LocalStorageItem.prototype.assign = function (data) {
  for (const key of Object.keys(data)) {
    this.data_[key] = data[key];
  }

  this.commit_();
};

function LocalStorage() {
  this.cache_ = {};
}

LocalStorage.prototype.getItem = function (key) {
  if (!this.cache_[key]) {
    this.cache_[key] = new LocalStorageItem(key);
  }

  return this.cache_[key];
};

const localStorage = new LocalStorage();

// Used by plugin store modules (gdpr, user, gettext-plugin) which are not real component
// instances, so they can't rely on the `this.$options.name`-based $localStorage getter below.
export function getNamedLocalStorageItem(name) {
  return localStorage.getItem(`${name}.preferences`);
}

export default function install(app) {
  // Defined via a `beforeCreate` mixin hook (rather than a getter on
  // app.config.globalProperties, as Vue 2's `Vue.prototype` equivalent naively translates to)
  // because Vue 3's proxy resolves global properties as `globalProperties[key]`, which runs
  // the getter with `this` bound to globalProperties itself, not to the component instance.
  // `beforeCreate` runs with `this` correctly bound to the component, before `data()` --
  // some components read `this.$localStorage` from `data()`, so it must exist by then; a
  // `computed` (evaluated only after `data()`) would be too late for those.
  app.mixin({
    beforeCreate() {
      const instance = this;

      Object.defineProperty(this, '$localStorage', {
        configurable: true,
        get() {
          if (!instance.$options.name) {
            throw new Error('Please set name property of your componenent');
          }

          // TODO anti pattern : with this, we can't change any component name
          // find another way. Maybe this in created() :
          // this.$localStorage
          return localStorage.getItem(`${instance.$options.name}.preferences`);
        },
      });
    },
  });
}
