// Whether this browser can show the 3D view: MapLibre GL JS 5+ needs WebGL 2. Checked once, on a canvas thrown away
// (its context released): small, so that the 2D map does not load MapLibre to know.
let supported: boolean | undefined;

export function supports3d(): boolean {
  if (supported === undefined) {
    try {
      const context = document.createElement('canvas').getContext('webgl2');
      supported = !!context;
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      supported = false;
    }
  }
  return supported;
}

/** After the 3D view failed to start: no 3D button any more on this page */
export function markUnsupported(): void {
  supported = false;
}
