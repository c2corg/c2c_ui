const fs = require('fs');

function processReadme(prefix, parent, name, result) {
  let data;

  try {
    data = fs.readFileSync(parent + '/' + name + '/README.md', 'utf-8');
    data = data.replace(/\r/g, '').split('\n')[0];
  } catch (error) {
    data = ' ';
  }

  result.push([prefix + name, data]);
}

function walkSync(dir, result, prefix = '') {
  for (const subDir of fs.readdirSync(dir)) {
    const path = dir + '/' + subDir;

    if (fs.statSync(path).isDirectory() && subDir !== 'utils') {
      processReadme(prefix, dir, subDir, result);
      walkSync(path, result, prefix + '    ');
    }
  }
}

function main() {
  const result = [];
  walkSync('src', result);

  const data = ['| **directory** | **comment** |\n|---|---|'];
  for (const line of result) {
    data.push(`|${line[0].replace(/ /g, '&nbsp;')}|${line[1]}|`);
  }

  fs.writeFileSync('docs/source-structure.md', data.join('\n'));
}

// If running this module directly then call the main function.
if (require.main === module) {
  main();
}

module.exports = main;
