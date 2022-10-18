// CAMPTOCAMP_CONFIG is a placeholder defined in vue.config.js
// Do not modify this file. If you need another build parameter
// please go to vue.config.js in root

const config = CAMPTOCAMP_CONFIG;

const LOCAL_STORAGE_KEY = 'SiteConfiguration.urlsName';

config.setUrlsName = function (name) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, name);
};

const urlsName = window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? config.urls.name;

if (!config.isProduction) {
  config.urls = config.urlsConfigurations[urlsName];
}

export default config;
