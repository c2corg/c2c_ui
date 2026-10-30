const fs = require('fs');
const path = require('path');
const parser = require('xml2js');

const HEADER = '// Auto-generated file by generate-icons.js\n\n';

const getTsTemplate = function (prefix, name, width, height, svgPathData) {
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

const isDirectory = (source) => fs.lstatSync(source).isDirectory();

function main() {
  const root = 'src/assets/font-awesome-custom/';

  for (let subDir of fs.readdirSync(root + 'svg')) {
    if (isDirectory(path.join(root + 'svg', subDir))) {
      if (!fs.existsSync(root + 'js/' + subDir)) {
        fs.mkdirSync(root + 'js/' + subDir);
      }

      for (let file of fs.readdirSync(root + 'svg/' + subDir)) {
        if (file.endsWith('.svg')) {
          fs.readFile(root + 'svg/' + subDir + '/' + file, function (err, data) {
            if (err) {
              console.error('Fail: ' + err);
            }
            parser.parseString(data, function (err, result) {
              if (err) {
                console.error('Fail: ' + err);
              }
              const name = file.replace('.svg', '');

              if (result && result.svg && result.svg.path) {
                fs.writeFileSync(
                  root + 'js/' + subDir + '/' + name + '.ts',
                  getTsTemplate(subDir, name, result.svg.$.width, result.svg.$.height, result.svg.path[0].$.d)
                );
                console.log('Done', subDir, name);
              } else {
                console.error('Fail', subDir, name);
              }
            });
          });
        }
      }
    }
  }
}

// If running this module directly then call the main function.
if (require.main === module) {
  main();
}

module.exports = main;
