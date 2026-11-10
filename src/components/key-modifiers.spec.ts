import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('templates', () => {
  // Vue 3 ignores numeric key modifiers (@keypress.13): the handler runs for any key, without the modifier's effect
  it('use key names, not key codes, as key modifiers', () => {
    const numeric = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.vue'))
      .map((file) => `src/${file}`)
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .flatMap((line, index) =>
            /(@|v-on:)key(up|down|press)\.(\w+\.)*\d+\b/.test(line) ? [`${file}:${index + 1}`] : []
          )
      );

    expect(numeric).toEqual([]);
  });
});
