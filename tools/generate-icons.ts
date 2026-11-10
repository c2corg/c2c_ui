import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { parseStringPromise } from 'xml2js';

const HEADER = '// Auto-generated file by generate-icons.ts\n\n';

const getTsTemplate = function (prefix: string, name: string, width: string, height: string, svgPathData: string) {
  return (
    HEADER +
    `import type { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

export default {
  prefix: '${prefix}' as IconPrefix,
  iconName: '${name}' as IconName,
  icon: [
    ${width},
    ${height},
    [],
    '',
    '${svgPathData}',
  ],
} satisfies IconDefinition;
`
  );
};

const isDirectory = (source: string) => lstatSync(source).isDirectory();

// the parts of the SVG files used: a single path, in a viewport of width x height
type Svg = { svg?: { $: { width: string; height: string }; path?: { $: { d: string } }[] } };

async function main() {
  const root = 'src/assets/font-awesome-custom/';

  for (const subDir of readdirSync(root + 'svg')) {
    if (isDirectory(path.join(root + 'svg', subDir))) {
      if (!existsSync(root + 'js/' + subDir)) {
        mkdirSync(root + 'js/' + subDir);
      }

      for (const file of readdirSync(root + 'svg/' + subDir)) {
        if (file.endsWith('.svg')) {
          const name = file.replace('.svg', '');
          const result: Svg = await parseStringPromise(readFileSync(root + 'svg/' + subDir + '/' + file));

          if (result && result.svg && result.svg.path) {
            writeFileSync(
              root + 'js/' + subDir + '/' + name + '.ts',
              getTsTemplate(subDir, name, result.svg.$.width, result.svg.$.height, result.svg.path[0].$.d)
            );
            // eslint-disable-next-line no-console
            console.log('Done', subDir, name);
          } else {
            console.error('Fail', subDir, name);
          }
        }
      }
    }
  }
}

main();
