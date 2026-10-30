import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { parse } from 'vue/compiler-sfc';

// tsconfig.json no longer allows JavaScript: a .js module would be left out of the type-check
describe('sources', () => {
  const files = readdirSync('src', { recursive: true, encoding: 'utf8' });

  it('have no JavaScript module', () => {
    expect(files.filter((file) => /\.(js|mjs|cjs|jsx)$/.test(file))).toEqual([]);
  });

  it('have no component script without lang="ts"', () => {
    // the <script> and <script setup> blocks, as Vue's compiler reads them
    const untyped = files
      .filter((file) => file.endsWith('.vue'))
      .filter((file) => {
        const { script, scriptSetup } = parse(readFileSync(`src/${file}`, 'utf8'), { filename: file }).descriptor;
        return [script, scriptSetup].some((block) => block && block.lang !== 'ts');
      });

    expect(untyped).toEqual([]);
  });
});
