import { describe, expect, it, vi } from 'vitest';

import { FrameQuality, isSoftwareRendering, qualityLevels } from './map-3d-quality';

describe('qualityLevels', () => {
  it('goes down from the pixel ratio of the screen to 1, then to fewer tiles', () => {
    expect(qualityLevels({ devicePixelRatio: 3 })).toEqual({
      levels: [
        { pixelRatio: 2, lod: null },
        { pixelRatio: 1.5, lod: null },
        { pixelRatio: 1.25, lod: null },
        { pixelRatio: 1, lod: null },
        { pixelRatio: 1, lod: [4, 2] },
      ],
      start: 0,
    });
    expect(qualityLevels({ devicePixelRatio: 1 }).levels).toEqual([
      { pixelRatio: 1, lod: null },
      { pixelRatio: 1, lod: [4, 2] },
    ]);
  });

  it('starts lower on a small device, at the lowest without a GPU', () => {
    expect(qualityLevels({ devicePixelRatio: 2, deviceMemory: 2 }).start).toBe(1);
    expect(qualityLevels({ devicePixelRatio: 2, hardwareConcurrency: 2 }).start).toBe(1);
    expect(qualityLevels({ devicePixelRatio: 2, softwareRendering: true }).start).toBe(4);
  });
});

describe('FrameQuality', () => {
  const levels = qualityLevels({ devicePixelRatio: 2 }).levels;
  const frames = (quality: FrameQuality, dt: number, count: number) => {
    for (let i = 0; i < count; i++) quality.frame(dt);
  };

  it('applies the level it starts at', () => {
    const apply = vi.fn();
    new FrameQuality(levels, 1, apply);
    expect(apply).toHaveBeenCalledWith(levels[1]);
  });

  it('goes down a level when the frames are too slow, after the start has settled', () => {
    const apply = vi.fn();
    const quality = new FrameQuality(levels, 0, apply);
    // 2 s of the start not counted
    frames(quality, 1 / 20, 40);
    expect(quality.level).toBe(0);
    frames(quality, 1 / 20, 45);
    expect(quality.level).toBe(1);
    expect(apply).toHaveBeenLastCalledWith(levels[1]);
    expect(quality.median).toBeCloseTo(1 / 20);
  });

  it('stays at 30 frames a second (a phone in low power mode), and never goes up', () => {
    const quality = new FrameQuality(levels, 0, vi.fn());
    frames(quality, 1 / 30, 500);
    expect(quality.level).toBe(0);

    const slow = new FrameQuality(levels, 0, vi.fn());
    frames(slow, 1 / 15, 40 + 45);
    frames(slow, 1 / 60, 1000);
    expect(slow.level).toBe(1);
  });

  it('measures again from nothing after a seek', () => {
    const quality = new FrameQuality(levels, 0, vi.fn());
    frames(quality, 1 / 20, 40 + 44);
    quality.settle();
    frames(quality, 1 / 20, 1);
    expect(quality.level).toBe(0);
  });

  it('stops at the lowest level', () => {
    const quality = new FrameQuality(levels, levels.length - 1, vi.fn());
    frames(quality, 1, 200);
    expect(quality.level).toBe(levels.length - 1);
  });
});

describe('isSoftwareRendering', () => {
  const gl = (renderer: string) =>
    ({
      RENDERER: 1,
      getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 2 }),
      getParameter: (name: number) => (name === 2 ? renderer : 'WebKit WebGL'),
    }) as unknown as WebGL2RenderingContext;

  it('tells SwiftShader and llvmpipe from a GPU', () => {
    expect(isSoftwareRendering(gl('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader)'))).toBe(
      true
    );
    expect(isSoftwareRendering(gl('llvmpipe (LLVM 15.0.7, 256 bits)'))).toBe(true);
    expect(isSoftwareRendering(gl('Apple GPU'))).toBe(false);
    expect(isSoftwareRendering(null)).toBe(false);
  });
});
