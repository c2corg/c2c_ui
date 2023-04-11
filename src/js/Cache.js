/*
 * This Object is a key-value disctionary, with these specificities  :
 *
 * * key and value must be strings
 * * the total size in charater is calculated in Cache._size
 * * Cache._size can't be greater than Cache._maxSize
 * * if it happens, "oldest" pairs are removed
 * * "oldest" and youngest are stored using Map object,
 *  which keep key insertion order.
 * * a given pair is reseted as the "youngest" one when :
 *   * feeded to the cache : Cache.feed()
 *   * requested : Cache.get()
 */

const Cache = function () {
  this._size = 0;
  this._data = new Map();
  // cache of 256ko
  // a document can contains around 10 markdown fields
  // each field contains 1000 char (raw estimations)
  // and we want to keep two versions of each field
  // plus a small amount
  // 10 * 1000 * 2 * 125% = 250k
  this._maxSize = 250000;
};

Cache.prototype.feed = function (key, value) {
  this.delete(key);

  this._data.set(key, value);
  this._size += key.length + value.length;

  if (this._size > this._maxSize) {
    const keys = this._data.keys();
    while (this._size > this._maxSize) {
      this.delete(keys.next().value);
    }
  }
};

Cache.prototype.has = function (key) {
  return this._data.has(key);
};

Cache.prototype.get = function (key) {
  const value = this._data.get(key);
  this.feed(key, value); // put it back to top

  return value;
};

Cache.prototype.delete = function (key) {
  if (this._data.has(key)) {
    this._size -= this._data.get(key).length + key.length;
    this._data.delete(key);
  }
};

export default Cache;
