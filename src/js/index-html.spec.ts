import { readFileSync, existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// vitest runs from the project root
const root = process.cwd();
const html = readFileSync(`${root}/index.html`, 'utf-8');

describe('index.html', () => {
  it('points the structured data logo to a file served as is', () => {
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1];
    const { pathname } = new URL(JSON.parse(json).logo);

    // public/ files keep their name; /assets/ only holds hashed build output, so a fixed name there is a 404
    expect(pathname.startsWith('/assets/')).toBe(false);
    expect(existsSync(`${root}/public${pathname}`)).toBe(true);
  });
});
