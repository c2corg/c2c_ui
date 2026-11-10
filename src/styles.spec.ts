// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundleAsync } from 'lightningcss';
import { describe, expect, it } from 'vitest';
import { compileStyle, parse } from 'vue/compiler-sfc';

import viteConfig from '../vite.config.ts';

// The styles are plain CSS, and compile as the build does (the specs run with `css: false`): the global CSS files of
// src/assets/css, Bulma's included, and the <style> blocks of the components, with Vue and Lightning CSS.

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

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
// the global CSS files
const globalFiles = files(join(src, 'assets/css'), /\.css$/);
// the <style> blocks in plain CSS, and the global CSS files
const cssBlocks = [
  ...styleBlocks(undefined),
  ...globalFiles.map((file) => ({
    file,
    name: relative(src, file),
    content: readFileSync(file, 'utf8'),
    scoped: false,
  })),
];
// all the CSS: global files and blocks of the components
const allCss = (): string[] => cssBlocks.map(({ content }) => content);

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

// the classes a global CSS file requires: in its selectors, not in :not(...)
const cssClasses = (css: string): string[] => {
  const selectors = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}');
  return [...selectors.replace(/:not\([^)]*\)/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
};

// classes of the global CSS that no source names: set at run time by a library
const runTimeClasses = ['swiper-wrapper'];

// the custom properties of assets/css/tokens.css: name (without --c2c-) and value
const tokens = new Map(
  [...readFileSync(join(src, 'assets/css/tokens.css'), 'utf8').matchAll(/--c2c-([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1],
    m[2],
  ])
);

describe('styles', () => {
  it('uses only breakpoints that exist', () => {
    const media = readFileSync(join(src, 'assets/css/media.css'), 'utf8');
    const used = new Set(allCss().flatMap((css) => [...css.matchAll(/(?<!var)\((--c2c-[\w-]+)\)/g)].map((m) => m[1])));
    expect([...used].filter((name) => !media.includes(`@custom-media ${name} `))).toEqual([]);
  });

  // a data URL cannot use a custom property
  it('draws the external link icon in the color of the links', () => {
    const css = readFileSync(join(src, 'assets/css/external-links.css'), 'utf8');
    expect(css).toContain(`fill='${encodeURIComponent(tokens.get('color-link')!)}'`);
  });

  it('uses only tokens that exist', () => {
    expect(tokens.size).toBeGreaterThan(30);
    const used = new Set(allCss().flatMap((css) => [...css.matchAll(/var\(--c2c-([\w-]+)/g)].map((m) => m[1])));
    expect([...used].filter((name) => !tokens.has(name))).toEqual([]);
  });

  it('has no Sass', () => {
    expect(files(src, /\.s[ac]ss$/).map((file) => relative(src, file))).toEqual([]);
    expect(styleBlocks('scss').map(({ name }) => name)).toEqual([]);
    expect(cssBlocks.length).toBeGreaterThan(200);
  });

  // a scoped style adds its data-v attribute to the rules it imports: they would not match the elements created by a
  // library (the controls of ol/ol.css, c2corg/c2c_ui#4955); media.css has no rules, only breakpoints
  it('imports only media.css in a scoped style', () => {
    const imports = cssBlocks
      .filter(({ scoped }) => scoped)
      .flatMap(({ name, content }) =>
        [...content.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)].map((m) => `${name}: ${m[1]}`)
      );
    expect(imports.length).toBeGreaterThan(20);
    expect(imports.filter((line) => !line.endsWith(': @/assets/css/media.css'))).toEqual([]);
  });

  // the global CSS has only the classes the site uses: Bulma's included, kept from its 0.9.4 Sass with the variants the
  // site used (c2corg/c2c_ui#4918); to use another one (`mt-6`, `is-outlined`...), write its rules
  it('has only classes the code uses in the global CSS', () => {
    const words = codeWords();
    const unused = new Set(
      globalFiles.flatMap((file) => cssClasses(readFileSync(file, 'utf8')).filter((name) => !words.has(name)))
    );
    expect([...unused].sort()).toEqual(runTimeClasses);
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
