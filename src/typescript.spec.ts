import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// tsconfig.json no longer allows JavaScript: a .js module would be left out of the type-check
describe('sources', () => {
  const files = readdirSync('src', { recursive: true, encoding: 'utf8' });

  it('have no JavaScript module', () => {
    expect(files.filter((file) => /\.(js|mjs|cjs|jsx)$/.test(file))).toEqual([]);
  });

  it('have no component script without lang="ts"', () => {
    const untyped = files
      .filter((file) => file.endsWith('.vue'))
      .filter((file) =>
        [...readFileSync(`src/${file}`, 'utf8').matchAll(/^<script\b[^>]*>/gmi)].some(
          ([tag]) => !tag.includes('lang="ts"')
        )
      );

    expect(untyped).toEqual([]);
  });
});
