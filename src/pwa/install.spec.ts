// Which install instructions the welcome tour, the home banner and the guide show: getting the platform wrong sends
// an iPad user hunting for a "⋮" menu Safari does not have
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setNavigator = ({ userAgent, platform = '', maxTouchPoints = 0 }: Record<string, string | number>) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(String(userAgent));
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(String(platform));
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true });
};

describe('install', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['iPhone', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari' }, 'ios'],
    // iPadOS 13+ claims to be a Mac: only the touch screen tells them apart
    [
      'iPad',
      { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 },
      'ios',
    ],
    [
      'Mac',
      { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 },
      'desktop',
    ],
    ['Android', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile' }, 'android'],
    ['Windows', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' }, 'desktop'],
  ])('recognises %s', async (_, nav, expected) => {
    setNavigator(nav);
    const { devicePlatform } = await import('./install');
    expect(devicePlatform()).toBe(expected);
  });

  it('keeps the browser prompt for our button, and uses it only once', async () => {
    const { default: install, promptInstall } = await import('./install');
    // cancelable, as the browser's is
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true); // no mini-bar of its own
    expect(install.deferredPrompt).toBe(event);
    await expect(promptInstall()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(install.deferredPrompt).toBeNull();
    await expect(promptInstall()).resolves.toBe(false);
  });

  it('stops offering once the app is installed', async () => {
    const { default: install } = await import('./install');
    window.dispatchEvent(new Event('appinstalled'));
    expect(install.installed).toBe(true);
  });
});
