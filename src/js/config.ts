// CAMPTOCAMP_CONFIG is a placeholder defined in vite.config.ts
// Do not modify this file. If you need another build parameter
// please go to vite.config.ts in root

import { LEGACY_BACKEND_LOCAL_STORAGE_KEY, selectBackend } from './backend-selection';
import { applyRuntimeConfig } from './runtime-config';

const config: BuildConfiguration = CAMPTOCAMP_CONFIG;

if (config.isBackendSelectable) {
  // per tab, see backend-selection.ts
  config.urls = config.urlsConfigurations[selectBackend(config, location.search, window.sessionStorage)];
  window.localStorage.removeItem(LEGACY_BACKEND_LOCAL_STORAGE_KEY);
} else if (location.hostname === 'www.demov6.camptocamp.org') {
  // production builds use production urls by default.
  // use hostname to set urls for demo
  config.urls = config.urlsConfigurations['demo'];
}

// Backend urls given when the container starts (window.CAMPTOCAMP_RUNTIME_CONFIG, from /config.js or inline in index.html), over the ones of
// the build: the same image can serve any backend
applyRuntimeConfig(config, window.CAMPTOCAMP_RUNTIME_CONFIG);

export default config;
