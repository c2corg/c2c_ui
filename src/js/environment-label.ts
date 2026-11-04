/**
 * Name of the non-production environment this app is served for (e.g. 'preprod'), given when the container starts
 * (C2C_ENV_LABEL, see docker/runtime-config.sh). Empty in production.
 */
export const environmentLabel: string = window.CAMPTOCAMP_RUNTIME_CONFIG?.environmentLabel ?? '';
