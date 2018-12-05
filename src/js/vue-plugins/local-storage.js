
/*
 * LocalStorage is a wrapper arround window.localStorage
 * it allows a key/string to be used as a key/{property:value} object
 */

function LocalStorageItem(key) {
    this.key = key
    this.data_ = JSON.parse(window.localStorage.getItem(key) || '{}')
}

LocalStorageItem.prototype.commit_ = function() {
    window.localStorage.setItem(this.key, JSON.stringify(this.data_))
}

LocalStorageItem.prototype.get = function(propertyName, defaultIfUndefined) {
    const result = this.data_[propertyName]
    return result === undefined ? defaultIfUndefined : result
}

LocalStorageItem.prototype.set = function(propertyName, value) {
    // deep copy of value
    value = JSON.parse(JSON.stringify(value))

    this.data_[propertyName] = value
    this.commit_()
}

LocalStorageItem.prototype.clear = function() {
    this.data_ = {}
    this.commit_()
}

LocalStorageItem.prototype.initialize = function(data) {
    this.data_ = Object.assign({}, data)
    this.commit_()
}

LocalStorageItem.prototype.assign = function(data) {
    for (let key of Object.keys(data)) {
        this.data_[key] = data[key]
    }

    this.commit_()
}

function LocalStorage() {
    this.cache_ = {}
}

LocalStorage.prototype.getItem = function(key) {
    if (!this.cache_[key]) {
        this.cache_[key] = new LocalStorageItem(key)
    }

    return this.cache_[key]
}

const localStorage = new LocalStorage()

export default function install(Vue) {
    Object.defineProperty(Vue.prototype, '$localStorage', {
        get() {
            if (!this.$options.name) {
                throw new Error('Please set name property of your componenent')
            }

            // TODO anti pattern : with this, we can't change any component name
            // find another way. Maybe this in created() :
            // this.$localStorage
            return localStorage.getItem(`${this.$options.name}.preferences`)
        }
    })
}
