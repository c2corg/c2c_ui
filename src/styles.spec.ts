// @vitest-environment node
// (Dart Sass needs the Uint8Array of Node, not the one of jsdom)
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { bundleAsync } from 'lightningcss';
import { compile, compileString, NodePackageImporter, type FileImporter, type Options } from 'sass';
import { describe, expect, it } from 'vitest';
import { compileStyle, parse } from 'vue/compiler-sfc';

import viteConfig from '../vite.config.ts';

// The styles compile as the build does (the specs run with `css: false`): main.scss without a Sass warning
// (deprecations, as Dart Sass 3.0 removes `@import` and the global built-in functions, and @warn alike), and the
// <style> blocks of the components, in plain CSS, with Vue and Lightning CSS.

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

// the `@/` alias of vite.config.ts; Sass resolves the extension and the partials
const aliasImporter: FileImporter<'sync'> = {
  findFileUrl: (url) => (url.startsWith('@/') ? new URL(url.slice(2), pathToFileURL(src).href + '/') : null),
};

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
const styleBlocks = (lang: string | undefined) =>
  vueFiles(src).flatMap((file) =>
    parse(readFileSync(file, 'utf8'), { filename: file })
      .descriptor.styles.map((style, index) => ({ style, index }))
      .filter(({ style }) => style.lang === lang && !style.src)
      .map(({ style, index }) => ({
        file,
        name: `${relative(src, file)} #${index + 1}`,
        content: style.content,
        scoped: Boolean(style.scoped),
      }))
  );
const scssBlocks = styleBlocks('scss');
const cssBlocks = styleBlocks(undefined);

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

// the custom properties of assets/css/tokens.css: name (without --c2c-) and value
const tokens = new Map(
  [...readFileSync(join(src, 'assets/css/tokens.css'), 'utf8').matchAll(/--c2c-([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1],
    m[2],
  ])
);

describe('styles', () => {
  // a token has the value of the Sass variable of the same name, which Bulma's Sass still uses
  it('gives the tokens the values of the Sass variables', () => {
    expect(tokens.size).toBeGreaterThan(30);
    const { css } = compileString(
      `@use 'variables' as *;\na { ${[...tokens.keys()].map((name) => `${name}: $${name};`).join(' ')} }`,
      { url: pathToFileURL(join(sassDir, 'tokens.scss')) }
    );
    const values = new Map([...css.matchAll(/^\s+([\w-]+): (.+);$/gm)].map((m) => [m[1], m[2]]));
    expect(values).toEqual(tokens);
  });

  // a breakpoint has the value of Bulma's Sass variable: (--c2c-min-tablet) is (min-width: $tablet)
  it('gives the breakpoints the values of the Sass variables', () => {
    const queries = [
      ...readFileSync(join(src, 'assets/css/media.css'), 'utf8').matchAll(/@custom-media --c2c-(\w+)-(\w+) (.+);/g),
    ];
    expect(queries.length).toBe(8);
    const { css } = compileString(
      `@use 'variables' as *;\na { ${queries.map(([, side, name]) => `${side}-${name}: $${name};`).join(' ')} }`,
      { url: pathToFileURL(join(sassDir, 'media.scss')) }
    );
    for (const [, side, name, query] of queries) {
      const value = css.match(new RegExp(`${side}-${name}: (.+);`))?.[1];
      expect(query).toBe(`(${side}-width: ${value})`);
    }
  });

  it('uses only breakpoints that exist', () => {
    const media = readFileSync(join(src, 'assets/css/media.css'), 'utf8');
    const used = new Set(
      vueFiles(src).flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(/(?<!var)\((--c2c-[\w-]+)\)/g)].map((m) => m[1])
      )
    );
    expect([...used].filter((name) => !media.includes(`@custom-media ${name} `))).toEqual([]);
  });

  it('uses only tokens that exist', () => {
    const used = new Set(
      vueFiles(src).flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/var\(--c2c-([\w-]+)/g)].map((m) => m[1]))
    );
    expect([...used].filter((name) => !tokens.has(name))).toEqual([]);
  });

  it('writes the styles of the components in plain CSS', () => {
    expect(scssBlocks.map(({ name }) => name)).toEqual([]);
    expect(cssBlocks.length).toBeGreaterThan(150);
  });

  it('compiles main.scss without a Sass warning', () => {
    const warnings = compileWarnings((options) => compile(join(src, 'assets/sass/main.scss'), options));
    expect(warnings).toEqual([]);
  });

  // the CSS has the classes of Bulma the site uses, and only them: a class used by the code and written by the guarded
  // modules of Bulma must be in the list of bulma/utilities/used.scss, and a listed class must be used
  it('lists the Bulma classes the code uses', () => {
    const generated = generatedClasses();
    expect(generated.size).toBeGreaterThan(900);
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

  // a plain CSS style is valid CSS for Lightning CSS, scoped by Vue then bundled as Vite does with the options of
  // vite.config.ts (no `//` comment, no Sass), and it imports media.css when it uses a breakpoint
  it.each(cssBlocks)('compiles the style of $name with Lightning CSS', async ({ file, content: source, scoped }) => {
    const { code: content, errors } = compileStyle({ source, filename: file, id: 'data-v-spec', scoped });
    expect(errors).toEqual([]);
    const { code, warnings } = await bundleAsync({
      ...viteConfig.css?.lightningcss,
      filename: file,
      errorRecovery: false,
      resolver: {
        read: (path) => (path === file ? content : readFileSync(path, 'utf8')),
        // the `@/` alias, a relative path or a package (ol/ol.css)
        resolve: (specifier, from) => {
          if (specifier.startsWith('@/')) {
            return join(src, specifier.slice(2));
          }
          return specifier.startsWith('.') ? join(from, '..', specifier) : join(root, 'node_modules', specifier);
        },
      },
    });
    expect(warnings).toEqual([]);
    expect(code.toString()).not.toMatch(/--c2c-(min|max)-/);
  });
});
