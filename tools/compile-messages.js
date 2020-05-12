// usage
//
//   node ./tools/compile-messages.js --user api:<token>

const fs = require('fs');
const { exec } = require('child_process');
const Compiler = require('angular-gettext-tools').Compiler;

const compiler = new Compiler({ format: 'json' });

// https://docs.transifex.com/api/examples#getting-a-translation-file-from-transifex
function getTranslation(lang, callback) {
  if (process.argv[2] !== '--user' || process.argv.length !== 4) {
    throw new Error('Usage : node ./tools/compile-messages.js --user api:<token>');
  }

  const authCurlOption = `--user ${process.argv[3]}`;
  const project = 'c2corg_ui';
  const resource = 'main';
  const curlCommand = 'curl -L';

  const baseUrl = `https://www.transifex.com/api/2/project/${project}/resource/${resource}`;
  const url = `${baseUrl}/translation/${lang}/?mode=reviewed&file`;

  const command = `${curlCommand} ${authCurlOption} -X GET "${url}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(`stderr: ${stderr}`);
      return;
    }
    callback(stdout);
  });
}

function convert(lang) {
  // eslint-disable-next-line no-console
  console.log('Requesting', lang, 'from transifex');

  const cleanTranslation = (obj) => {
    const result = {}

    for(const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value == "string") {
        const cleanValue = value.trim();
        if (cleanValue !== key) {
          result[key] = cleanValue;
        }
      } else {
        const cleanValue = cleanTranslation(value);
        if (Object.keys(cleanValue).length !== 0) {
          result[key] = cleanValue;
        }
      }
    }

    return result;
  }

  getTranslation(lang, (data) => {
    // save indented json : need to parse/stringify...
    let output = JSON.parse(compiler.convertPo([data]));
    output = cleanTranslation(output);

    fs.writeFileSync('src/translations/dist/' + lang + '.json', JSON.stringify(output, null, 2));

    // eslint-disable-next-line no-console
    console.log(lang, 'finished');
    // Todo : create a Pull Request on Github
  });
}

function main() {
  ['fr', 'en', 'es', 'eu', 'de', 'it', 'ca', 'zh_CN'].forEach(convert);
}

// If running this module directly then call the main function.
if (require.main === module) {
  main();
}

module.exports = main;
