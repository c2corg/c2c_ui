/*
 * Screenshots of the UI at exact window sizes, to compare a layout before and after a change.
 *
 *   node tools/screenshots.ts shoot <shots.json> <out dir> [--filter <text>] [--base <url>] [--backend <name>]
 *       Takes each shot of the list in a fresh headless Chromium context (service workers blocked, ads and analytics
 *       aborted, the cookie banner and the onboarding tour already dismissed). --base: the served UI (default
 *       http://localhost:8080, npm run serve). --backend: the backend chosen as by the backend selector of the
 *       navigation (default localhost, the local API on :6543; prod goes through the proxy of the dev server and
 *       gets HTTP 429 after a few pages). The local API only allows the :8080 origin: on another port, web security
 *       is turned off. --filter: only the shots whose name holds the text.
 *
 *   node tools/screenshots.ts compare <before dir> <after dir> <out dir> [--filter <text>]
 *       For each image of both dirs: SAME, or DIFF with the box of the changed pixels, and the two side by side in
 *       <out dir> (before on the left). A one-icon box at the top left is the animation of the side menu, not a change.
 *
 * A shot: { name, path, width, height, wait? (ms after load, default 2500), click? (selectors, in turn),
 *   run? (a script run in the page before the shot), log? (a script whose result is printed: measures),
 *   element? (a selector: shoot only that element), fullPage?, touch? }
 *
 * Needs the Chromium of Playwright: npx playwright install chromium-headless-shell. See
 * .github/skills/ui-screenshots for the before/after workflow.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium } from '@playwright/test';

type Shot = {
  name: string;
  path: string;
  width: number;
  height: number;
  wait?: number;
  click?: string[];
  run?: string;
  log?: string;
  element?: string;
  fullPage?: boolean;
  touch?: boolean;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    filter: { type: 'string', default: '' },
    base: { type: 'string', default: 'http://localhost:8080' },
    backend: { type: 'string', default: 'localhost' },
  },
});
const [command, ...args] = positionals;

// the results, on the standard output
// eslint-disable-next-line no-console
const print = (...items: unknown[]) => console.log(...items);

async function shoot(shotsFile: string, outDir: string) {
  const shots = (JSON.parse(readFileSync(shotsFile, 'utf8')) as Shot[]).filter((shot) =>
    shot.name.includes(values.filter)
  );
  mkdirSync(outDir, { recursive: true });
  const crossOrigin = values.backend === 'localhost' && new URL(values.base).port !== '8080';
  const browser = await chromium.launch({ args: crossOrigin ? ['--disable-web-security'] : [] });
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      serviceWorkers: 'block',
      hasTouch: Boolean(shot.touch),
    });
    await context.addInitScript((backend) => {
      sessionStorage.setItem('SiteConfiguration.backend', backend);
      localStorage.setItem('Gdpr.preferences', JSON.stringify({ choice: { date: Date.now() } }));
      localStorage.setItem('Onboarding.preferences', JSON.stringify({ done: true }));
    }, values.backend);
    await context.route(/googletag|doubleclick|googlesyndication|google-analytics|googletagmanager|matomo/, (route) =>
      route.abort()
    );
    const page = await context.newPage();
    try {
      await page.goto(values.base + shot.path, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(shot.wait ?? 2500);
      for (const selector of shot.click ?? []) {
        await page.locator(selector).first().click({ timeout: 5000 });
        await page.waitForTimeout(1500);
      }
      if (shot.run) {
        await page.evaluate(shot.run);
        await page.waitForTimeout(1000);
      }
      if (shot.log) {
        print(shot.name, JSON.stringify(await page.evaluate(shot.log)));
      }
      const path = join(outDir, `${shot.name}.png`);
      if (shot.element) {
        const element = page.locator(shot.element).first();
        await element.scrollIntoViewIfNeeded();
        await element.screenshot({ path });
      } else {
        await page.screenshot({ path, fullPage: Boolean(shot.fullPage) });
      }
      print('ok', shot.name);
    } catch (error) {
      print('FAIL', shot.name, (error as Error).message.split('\n')[0]);
      process.exitCode = 1;
    }
    await context.close();
  }
  await browser.close();
}

// the images are compared and put side by side in a canvas of the browser: no image library needed
async function compare(beforeDir: string, afterDir: string, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const before = new Set(readdirSync(beforeDir));
  const names = readdirSync(afterDir).filter(
    (name) => name.endsWith('.png') && before.has(name) && name.includes(values.filter)
  );
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const name of names.sort()) {
    const [a, b] = [beforeDir, afterDir].map(
      (dir) => `data:image/png;base64,${readFileSync(join(dir, name)).toString('base64')}`
    );
    const result = await page.evaluate(
      async ([a, b]) => {
        const load = (src: string) =>
          new Promise<HTMLImageElement>((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = src;
          });
        const [before, after] = await Promise.all([load(a), load(b)]);
        const pixels = (image: HTMLImageElement) => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height).data;
        };
        const sizes = `${before.width}x${before.height} ${after.width}x${after.height}`;
        let box: number[] | null = null;
        if (before.width === after.width && before.height === after.height) {
          const [p, q] = [pixels(before), pixels(after)];
          for (let i = 0; i < p.length; i += 4) {
            if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2]) {
              const x = (i / 4) % before.width;
              const y = Math.floor(i / 4 / before.width);
              box = box
                ? [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)]
                : [x, y, x, y];
            }
          }
          if (!box) return { sizes, same: true };
        }
        const canvas = document.createElement('canvas');
        canvas.width = before.width + after.width + 10;
        canvas.height = Math.max(before.height, after.height);
        const context = canvas.getContext('2d')!;
        context.fillStyle = 'red';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(before, 0, 0);
        context.drawImage(after, before.width + 10, 0);
        return { sizes, same: false, box, png: canvas.toDataURL('image/png') };
      },
      [a, b]
    );
    print(result.same ? 'SAME' : 'DIFF', name, result.sizes, result.box ? `box ${result.box.join(',')}` : '');
    if (result.png) {
      writeFileSync(join(outDir, name), Buffer.from(result.png.split(',')[1], 'base64'));
    }
  }
  await browser.close();
}

if (command === 'shoot' && args.length === 2) {
  await shoot(args[0], args[1]);
} else if (command === 'compare' && args.length === 3) {
  await compare(args[0], args[1], args[2]);
} else {
  console.error('usage: see the header of tools/screenshots.ts');
  process.exitCode = 2;
}
