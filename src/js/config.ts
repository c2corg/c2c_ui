// CAMPTOCAMP_CONFIG is a placeholder defined in vite.config.ts
// Do not modify this file. If you need another build parameter
// please go to vite.config.ts in root

import { applyRuntimeConfig } from './runtime-config';

const LOCAL_STORAGE_KEY = 'SiteConfiguration.urlsName';

const config: BuildConfiguration & { setUrlsName(name: string): void } = Object.assign(CAMPTOCAMP_CONFIG, {
  setUrlsName(name: string) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, name);
  },
});

const urlsName = window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? config.urls.name;

if (config.isBackendSelectable) {
  config.urls = config.urlsConfigurations[urlsName];
} else if (location.hostname === 'www.demov6.camptocamp.org') {
  // production builds use production urls by default.
  // use hostname to set urls for demo
  config.urls = config.urlsConfigurations['demo'];
}

// Backend urls given when the container starts (window.CAMPTOCAMP_RUNTIME_CONFIG, from /config.js), over the ones of
// the build: the same image can serve any backend
applyRuntimeConfig(config, window.CAMPTOCAMP_RUNTIME_CONFIG);

export default config;
