import config from './config';

/**
 * Name of the non-production environment this app is served for (e.g. 'preprod'), given when the container starts
 * (C2C_ENV_LABEL, see docker/runtime-config.sh). Empty in production.
 */
export const environmentLabel: string = window.CAMPTOCAMP_RUNTIME_CONFIG?.environmentLabel ?? '';

/**
 * The app writes to another database than production's: the selected backend (dev server, GitHub Pages previews) is not
 * prod, or the container names its environment (the preprod container keeps the `prod` urls entry, overridden)
 */
export const isNonProductionBackend: boolean = config.urls.name !== 'prod' || Boolean(environmentLabel);
