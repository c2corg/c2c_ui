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

const files = (dir: string, pattern: RegExp): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return files(path, pattern);
    }
    return pattern.test(entry.name) ? [path] : [];
  });
const vueFiles = (dir: string): string[] => files(dir, /\.vue$/);

// the <style> blocks as @vitejs/plugin-vue sees them; the number is the block's position among all the file's styles
const scssBlocks = vueFiles(src).flatMap((file) =>
  parse(readFileSync(file, 'utf8'), { filename: file })
    .descriptor.styles.map((style, index) => ({ style, index }))
    .filter(({ style }) => style.lang === 'scss' && !style.src)
    .map(({ style, index }) => ({ file, name: `${relative(src, file)} #${index + 1}`, content: style.content }))
);

// The words of the code that can be class names: templates and scripts of the components, TypeScript and JavaScript
// modules, translations, index.html. Not the styles, nor the specs.
const code = (file: string): string => {
  const content = readFileSync(file, 'utf8');
  if (!file.endsWith('.vue')) {
    return content;
  }
  // the blocks of the component as @vitejs/plugin-vue sees them, without its <style> blocks
  const { template, script, scriptSetup } = parse(content, { filename: file }).descriptor;
  return [template, script, scriptSetup].map((block) => block?.content ?? '').join('\n');
};

const codeWords = (): Set<string> => {
  const sources = [
    ...files(src, /\.(vue|ts|js|json|html)$/).filter((file) => !/\.spec\.ts$/.test(file)),
    join(root, 'index.html'),
  ].map(code);
  return new Set(sources.join('\n').split(/[^\w-]+/));
};

const sassDir = join(src, 'assets/sass');
// the classes the guarded generators of Bulma can write (bulma/utilities/used.scss), from the selectors they report
const generatedClasses = (): Set<string> => {
  const selectors: string[] = [];
  compileString(`@use 'bulma/utilities/used' with ($all: true, $report: true);\n@use 'main';`, {
    url: pathToFileURL(join(sassDir, 'used-report.scss')),
    logger: {
      warn() {},
      debug(message) {
        if (message.startsWith('used.rule: ')) {
          selectors.push(message.slice('used.rule: '.length));
        }
      },
    },
  });
  // the classes a selector requires: not those of :not(...)
  const required = (selector: string) => selector.replace(/:not\([^)]*\)/g, '');
  return new Set(
    selectors.flatMap((selector) => [...required(selector).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))
  );
};

const listedClasses = (): string[] => {
  const module = readFileSync(join(sassDir, 'bulma/utilities/used.scss'), 'utf8');
  const list = module.match(/^\$classes: \(([\s\S]*?)\);/m)?.[1] ?? '';
  return [...list.matchAll(/'([\w-]+)'/g)].map((m) => m[1]);
};

describe('styles', () => {
  it('finds the scss blocks of the components', () => {
    expect(scssBlocks.length).toBeGreaterThan(100);
  });

  it('compiles main.scss without a Sass warning', () => {
    const warnings = compileWarnings((options) => compile(join(src, 'assets/sass/main.scss'), options));
    expect(warnings).toEqual([]);
  });

  // the CSS has the helpers and columns the site uses, and only them: a class used by the code and generated by Bulma's
  // helpers must be in the list of bulma/utilities/used.scss, and a listed class must be used
  it('lists the variants of the Bulma helpers the code uses', () => {
    const generated = generatedClasses();
    expect(generated.size).toBeGreaterThan(500);
    const words = codeWords();
    const used = [...generated].filter((name) => words.has(name)).sort();
    expect(listedClasses().sort()).toEqual(used);
  });

  // a selector is kept when all the classes it requires are listed; those of :not(...) are not required
  it.each([
    ['.column:not(.is-narrow-unknown)', '.column:not(.is-narrow-unknown)'],
    ['.container.is-widescreen:not(.is-max-desktop)', null],
    ['.column:hover, .column.is-black', '.column:hover'],
  ])('keeps %s as %s', (selector, kept) => {
    const { css } = compileString(`@use 'bulma/utilities/used';\na { kept: '#{used.only('${selector}')}'; }`, {
      url: pathToFileURL(join(sassDir, 'used-only.scss')),
    });
    expect(css.match(/kept: "(.*)";/)?.[1]).toBe(kept ?? '');
  });

  it.each(scssBlocks)('compiles the style of $name without a Sass warning', ({ file, content }) => {
    const warnings = compileWarnings((options) =>
      compileString(additionalData + content, { ...options, url: pathToFileURL(file) })
    );
    expect(warnings).toEqual([]);
  });
});
