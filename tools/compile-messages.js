const os = require('os');
const iniparser = require('iniparser');
const fs = require('fs');
const https = require('https');
const Compiler = require('angular-gettext-tools').Compiler;

const compiler = new Compiler({ format: 'json' });

function convert(lang, config) {
  const user = config['username'];
  const token = config['password'];
  const project = 'c2corg_ui';
  const resource = 'main';

  const options = {
    host: 'www.transifex.com',
    path: '/api/2/project/' + project + '/resource/' + resource + '/translation/' + lang + '/?mode=reviewed&file',
    // authentication headers
    headers: {
      'Authorization': 'Basic ' + new Buffer(user + ':' + token).toString('base64')
    }
  };

  console.log('Requesting', lang, 'from transifex');
  https.get(options, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      // save indented json : need to parse/stringify...
      // does angular-gettext has options for json format ?
      const output = JSON.parse(compiler.convertPo([data]));
      fs.writeFileSync('src/translations/dist/' + lang + '.json', JSON.stringify(output, null, 2));

      console.log(lang, 'finished');
    });
  });
}

function main() {
  // auth info are in .transifexrc, config file for transifex client
  iniparser.parse(os.homedir() + '/.transifexrc', function(err, data) {
    const config = data['https://www.transifex.com'];

    const inputs = ['fr', 'en', 'es', 'eu', 'de', 'it', 'ca'];

    for (const lang of inputs) {
      convert(lang, config);
    }
  });
}

// If running this module directly then call the main function.
if (require.main === module) {
  main();
}

module.exports = main;
