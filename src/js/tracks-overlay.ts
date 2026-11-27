/**
 * Whether the Outings and Routes map overlays are offered (TRACKS_OVERLAY_ENABLED, the variable the API reads too, see
 * docker/runtime-config.sh). They are, unless the container starts with it set to false, 0, no or off: the way to turn
 * them off, without a new image, when they load the servers too much.
 */
export const tracksOverlayEnabled: boolean = window.CAMPTOCAMP_RUNTIME_CONFIG?.tracksOverlay !== false;
