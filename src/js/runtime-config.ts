/**
 * Applies the runtime configuration on top of the configuration baked at build time (see vite.config.ts).
 *
 * The runtime configuration is `window.CAMPTOCAMP_RUNTIME_CONFIG`, defined by `/config.js`. That file is empty in the
 * build output (public/config.js) and rewritten when the Docker container starts, from its C2C_* environment variables
 * (docker/runtime-config.sh):
 *
 * { backend: 'demo', urls: { api: 'https://api.example.org', ... } }
 *
 * - `backend` picks one of the `urlsConfigurations` of the build as the starting point;
 * - `urls` then overrides single entries of it (api, media, imageBackend, tracking, miniatures, forum, recaptchaKey...).
 *
 * Builds where the user chooses the backend in the interface (`isBackendSelectable`: local development, GitHub Pages
 * previews) ignore it: the choice made there wins.
 *
 * @param config The configuration injected by Vite, modified in place
 * @param runtime The runtime configuration, if any
 */
export function applyRuntimeConfig<T extends BuildConfiguration>(config: T, runtime?: RuntimeConfiguration): T {
  if (!runtime || config.isBackendSelectable) {
    return config;
  }

  if (runtime.backend) {
    if (config.urlsConfigurations[runtime.backend]) {
      config.urls = config.urlsConfigurations[runtime.backend];
    } else {
      console.warn(`Unknown backend "${runtime.backend}", keeping "${config.urls.name}"`);
    }
  }

  if (runtime.urls) {
    // a new object: the entries of `urlsConfigurations` are shared and must stay untouched
    config.urls = { ...config.urls, ...runtime.urls };
  }

  return config;
}
