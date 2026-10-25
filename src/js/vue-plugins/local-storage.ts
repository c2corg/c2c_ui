/*
 * LocalStorage is a wrapper arround window.localStorage
 * it allows a key/string to be used as a key/{property:value} object
 */

type Data = Record<string, unknown>;

class LocalStorageItem {
  key: string;
  data_: Data;

  constructor(key: string) {
    this.key = key;
    try {
      const data = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      // anything but an object (e.g. null, stored by another script or a former version) is no preferences record
      this.data_ = data !== null && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch {
      this.data_ = {};
    }
  }

  commit_() {
    window.localStorage.setItem(this.key, JSON.stringify(this.data_));
  }

  // the stored values are what the callers stored: they read them back with the type they know. Without a default, a
  // value never stored is undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(propertyName: string): T | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(propertyName: string, defaultIfUndefined: T): T;
  get<T>(propertyName: string, defaultIfUndefined?: T): T | undefined {
    const result = this.data_[propertyName];
    return (result === undefined ? defaultIfUndefined : result) as T | undefined;
  }

  set(propertyName: string, value: unknown) {
    // deep copy of value
    value = JSON.parse(JSON.stringify(value));

    this.data_[propertyName] = value;
    this.commit_();
  }

  clear() {
    this.data_ = {};
    this.commit_();
  }

  initialize(data: Data) {
    this.data_ = Object.assign({}, data);
    this.commit_();
  }

  assign(data: Data) {
    for (const key of Object.keys(data)) {
      this.data_[key] = data[key];
    }

    this.commit_();
  }
}

export type { LocalStorageItem };

class LocalStorage {
  cache_: Record<string, LocalStorageItem> = {};

  getItem(key: string): LocalStorageItem {
    if (!this.cache_[key]) {
      this.cache_[key] = new LocalStorageItem(key);
    }

    return this.cache_[key];
  }
}

const localStorage = new LocalStorage();

/** The preferences stored under a name ("<name>.preferences" in window.localStorage) */
export function getPreferences(name: string): LocalStorageItem {
  return localStorage.getItem(`${name}.preferences`);
}
