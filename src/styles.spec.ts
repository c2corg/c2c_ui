// @vitest-environment node
// (Dart Sass needs the Uint8Array of Node, not the one of jsdom)
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { compile, compileString, NodePackageImporter, type FileImporter, type Options } from 'sass';
import { describe, expect, it } from 'vitest';
import { parse } from 'vue/compiler-sfc';

import viteConfig from '../vite.config.ts';

// Every style of the app compiles without a Sass warning: deprecations (Dart Sass 3.0 removes `@import` and the
// global built-in functions) and @warn alike. The specs run with `css: false`, so this compiles the styles as the
// build does: main.scss, then each <style lang="scss"> block with the `additionalData` of vite.config.ts.

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

// the `@/` alias of vite.config.ts; Sass resolves the extension and the partials
const aliasImporter: FileImporter<'sync'> = {
  findFileUrl: (url) => (url.startsWith('@/') ? new URL(url.slice(2), pathToFileURL(src).href + '/') : null),
};

const scssOptions = viteConfig.css?.preprocessorOptions?.scss as { additionalData?: string } | undefined;
const additionalData = scssOptions?.additionalData ?? '';

const compileWarnings = (run: (options: Options<'sync'>) => unknown): string[] => {
  const warnings: string[] = [];
  run({
    importers: [new NodePackageImporter(root), aliasImporter],
    loadPaths: [join(root, 'node_modules')],
    // report every occurrence, not the first five of each kind
    verbose: true,
    logger: {
      warn(message, { span }) {
        warnings.push(span ? `${message} (${span.url?.pathname}:${span.start.line + 1})` : message);
      },
      debug() {},
    },
  });
  return warnings;
};

const vueFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return vueFiles(path);
    }
    return entry.name.endsWith('.vue') ? [path] : [];
  });

// the <style> blocks as @vitejs/plugin-vue sees them; the number is the block's position among all the file's styles
const scssBlocks = vueFiles(src).flatMap((file) =>
  parse(readFileSync(file, 'utf8'), { filename: file })
    .descriptor.styles.map((style, index) => ({ style, index }))
    .filter(({ style }) => style.lang === 'scss' && !style.src)
    .map(({ style, index }) => ({ file, name: `${relative(src, file)} #${index + 1}`, content: style.content }))
);

describe('styles', () => {
  it('finds the scss blocks of the components', () => {
    expect(scssBlocks.length).toBeGreaterThan(100);
  });

  it('compiles main.scss without a Sass warning', () => {
    const warnings = compileWarnings((options) => compile(join(src, 'assets/sass/main.scss'), options));
    expect(warnings).toEqual([]);
  });

  it.each(scssBlocks)('compiles the style of $name without a Sass warning', ({ file, content }) => {
    const warnings = compileWarnings((options) =>
      compileString(additionalData + content, { ...options, url: pathToFileURL(file) })
    );
    expect(warnings).toEqual([]);
  });
});
