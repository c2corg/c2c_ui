import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// the answer is kept for the page: a fresh module for each case
const load = async () => {
  vi.resetModules();
  return import('./map-3d-support');
};

describe('supports3d', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('is true with WebGL 2, and releases the context of the test', async () => {
    const loseContext = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ getExtension: () => ({ loseContext }) } as never);
    const { supports3d } = await load();
    expect(supports3d()).toBe(true);
    expect(supports3d()).toBe(true);
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(loseContext).toHaveBeenCalled();
  });

  it('is false without WebGL 2', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { supports3d } = await load();
    expect(supports3d()).toBe(false);
  });

  it('is false when the canvas fails', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { supports3d } = await load();
    expect(supports3d()).toBe(false);
  });

  it('is false after the 3D view failed to start', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ getExtension: () => null } as never);
    const { markUnsupported, supports3d } = await load();
    expect(supports3d()).toBe(true);
    markUnsupported();
    expect(supports3d()).toBe(false);
  });
});
