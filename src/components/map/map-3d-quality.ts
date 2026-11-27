// the quality of the 3D view during the flyover (MapFlyover.vue), adapted to the device: what it draws per frame goes
// down by steps when the frames come too slowly, never up again during the flyover (no back and forth). A step: fewer
// pixels (the pixel ratio of the canvas, the most of the cost on the GPU of a phone), then fewer tiles towards the
// horizon (the tile level of detail of MapLibre).

/** A level of quality: the pixel ratio of the canvas, and the tile level of detail (null: that of MapLibre) */
export type QualityLevel = {
  pixelRatio: number;
  lod: [maxZoomLevelsOnScreen: number, tileCountMaxMinRatio: number] | null;
};

// the default tile level of detail of MapLibre (createCalculateTileZoomFunction), to go back to
export const DEFAULT_LOD: [number, number] = [9.314, 3];
// fewer zoom levels and tiles towards the horizon: far less tiles at the pitch of the flyover
const LOW_LOD: [number, number] = [4, 2];

/** What the device tells of itself: its screen, and the hints of the browser where it gives them */
export type DeviceHints = {
  devicePixelRatio: number;
  // GB, Chromium only
  deviceMemory?: number;
  hardwareConcurrency?: number;
  // WebGL drawn on the CPU (SwiftShader, llvmpipe): the lowest level from the start
  softwareRendering?: boolean;
};

/** The levels, from the best to the lowest, and the one to start at */
export function qualityLevels(hints: DeviceHints, maxPixelRatio = 2): { levels: QualityLevel[]; start: number } {
  const best = Math.min(hints.devicePixelRatio || 1, maxPixelRatio);
  const ratios = [...new Set([best, 1.5, 1.25, 1].filter((ratio) => ratio <= best))];
  const levels: QualityLevel[] = [
    ...ratios.map((pixelRatio) => ({ pixelRatio, lod: null })),
    // never more pixels than the best: a screen below 1 (a page zoomed out)
    { pixelRatio: Math.min(best, 1), lod: LOW_LOD },
  ];
  const low = (hints.deviceMemory !== undefined && hints.deviceMemory <= 2) || (hints.hardwareConcurrency ?? 8) <= 2;
  const start = hints.softwareRendering ? levels.length - 1 : low ? Math.min(1, levels.length - 1) : 0;
  return { levels, start };
}

/** Whether WebGL is drawn on the CPU */
export function isSoftwareRendering(gl: WebGLRenderingContext | WebGL2RenderingContext | null): boolean {
  if (!gl) return false;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
  return /swiftshader|llvmpipe|software|softpipe/i.test(renderer);
}

/**
 * Watches the frames of the flyover and lowers the level when they come too slowly: the median interval over `window`
 * frames above `slow` seconds, after `settle` seconds without a change (tiles loading at the start or after a seek, the
 * level just changed)
 */
export class FrameQuality {
  private intervals: number[] = [];
  private quiet = 0;
  level: number;
  // the median of the frame intervals of the last window measured
  median = 0;

  constructor(
    readonly levels: QualityLevel[],
    start: number,
    private readonly apply: (level: QualityLevel) => void,
    // slow: below 28 frames a second (a phone in low power mode draws 30 at most: no reason to go down)
    private readonly options = { window: 45, slow: 1 / 28, settle: 2 }
  ) {
    this.level = start;
    apply(levels[start]);
  }

  /** Something changed what the frames cost (a seek, a transition): not measured for a while */
  settle(): void {
    this.intervals = [];
    this.quiet = 0;
  }

  /** A frame of the flyover playing, `dt` seconds after the one before */
  frame(dt: number): void {
    if (dt <= 0) return;
    if (this.quiet < this.options.settle) {
      this.quiet += dt;
      return;
    }
    this.intervals.push(dt);
    if (this.intervals.length < this.options.window) return;
    const sorted = [...this.intervals].sort((a, b) => a - b);
    this.median = sorted[Math.floor(sorted.length / 2)];
    this.intervals = [];
    if (this.median > this.options.slow && this.level < this.levels.length - 1) {
      this.level++;
      this.apply(this.levels[this.level]);
      this.settle();
    }
  }
}
