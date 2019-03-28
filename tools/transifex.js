#!/usr/bin/env node

/*****************************************
Extract untranslated string from .vue and .js files
and save them into a .pot file :

https://www.gnu.org/software/gettext/manual/gettext.html

Supported patterns in .vue and .js files :

    $gettext('msgid')
    $gettext('msgid', 'msgctx')

Supported pattern in .vue file, inside <template /> part :

    Any node that contains a v-translate directive.
    translate-context attribute is optional
    node must contains only one text node

    Exemple :

        <span v-translate> Hello </span>
        <span v-translate translate-context="World"> Hello </span>

******************************************/

const fs = require('fs');
const axios = require('axios');
const vueCompiler = require('vue-template-compiler');
const GettextCompiler = require('angular-gettext-tools').Compiler;
const gettextCompiler = new GettextCompiler({ format: 'json' });

const NODETYPE_TEXT = 3;

const project = 'c2corg_ui';
const resource = 'main';
const baseUrl = `https://www.transifex.com/api/2/project/${project}/resource/${resource}`;

const template_regex = /(<template>[\s\S]*<\/template>)/;
const gettext_template1 = /\$gettext\('((?:[^']|\\')*?)'\)/g;
const gettext_template2 = /\$gettext\('((?:[^']|\\')*?)', *'([^']*?)'\)/g;

/**************************************************************************
  a "Result" is a .pot item (msgctxt/msgid), with every associated meta-data
**************************************************************************/
function Result(msgctxt, msgid) {
  this.msgctxt = msgctxt;
  this.msgid = msgid;
  this.files = {}; // fake hastable
}

Result.prototype.addFile = function(file) {
  this.files[file] = null;
};

Result.prototype.toString = function() {
  let result = '#: ' + Object.keys(this.files).sort().join('\n#: ') + '\n';

  result += this.msgctxt ? `msgctxt "${this.msgctxt}"\n` : '';
  result += `msgid "${this.msgid}"\n`;
  result += `msgstr ""\n`;

  return result;
};

function Process() {
  // data is a simple key-value dict, where key
  this.data = {};
}

Process.prototype.push = function(file, msgctxt, msgid) {
  // trim
  msgid = msgid.replace(/^[\r\n\s]*/g, '');
  msgid = msgid.replace(/[\r\n\s]*$/g, '');
  msgid = msgid.replace(/\n/g, ' ');
  msgid = msgid.replace(/\t/g, ' ');
  msgid = msgid.replace(/\s+/g, ' ');

  // keep lower case msgid in first, at's it will be used for sorting
  const key = `${msgid.toLowerCase()}\u0002${msgid}\u0002${msgctxt}`;

  if (this.data[key] === undefined) {
    this.data[key] = new Result(msgctxt, msgid);
  }

  this.data[key].addFile(file);
};

Process.prototype.addVueComponent = function(file, data) {
  this.parseTemplate(file, data);
  this.parseScript(file, data, gettext_template1);
  this.parseScript(file, data, gettext_template2);
};

Process.prototype.addScript = function(file, data) {
  this.parseScript(file, data, gettext_template1);
  this.parseScript(file, data, gettext_template2);
};

Process.prototype.parseScript = function(file, data, regex) {
  let msgData;

  const lines = data.split('\n');

  for (let i = 0; i < lines.length; i++) {
    while ((msgData = regex.exec(lines[i])) !== null) {
      const msgid = msgData[1];
      const msgctxt = msgData[2];

      this.push(`${file}:` + (i + 1), msgctxt, msgid.replace(/\\'/g, '\''));
    }
  }
};

Process.prototype.parseTemplate = function(file, data) {
  // we need line number, but compiler does not provide it.
  // let use a trick : we do not use directive argument, so
  // we will modifiy our script by adding v-translate:N
  // where N is the line number
  data = data.split('\n');
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].replace(/v-translate/g, 'v-translate:' + (i + 1));
  }
  data = data.join('\n');

  // get template part
  const template = template_regex.exec(data);

  if (template === null) {
    // eslint-disable-next-line no-console
    console.log(`${file} has no template`);
    return;
  }

  const parseTranslateDirective = function(node, directiveMeta) {
    const line = directiveMeta.arg; // the trick: arg is the line number
    const position = file + ':' + line;
    let msgctxt;

    if (node.children.length !== 1) {
      throw new Error(`In ${position}\nNodes with v-translate directive must contains only one child`);
    }

    if (node.children[0].type !== NODETYPE_TEXT) {
      throw new Error(`In ${position}\nInterploation is not yet supported. Please use $gettext`);
    }

    for (const attribute of node.attrsList) {
      if (attribute.name === 'translate-context') {
        msgctxt = attribute.value;
      }
    }

    const msgid = node.children[0].text;
    this.push(position, msgctxt, msgid);
  };

  vueCompiler.compile(template[1], {
    preserveWhitespace: false,
    directives: {
      translate: parseTranslateDirective.bind(this)
    }
  });
};

Process.prototype.extract = function(file_or_dir) {
  if (fs.statSync(file_or_dir).isDirectory()) {
    const files = fs.readdirSync(file_or_dir);
    for (const file of files) {
      this.extract(file_or_dir + '/' + file);
    }
  } else if (file_or_dir.endsWith('.vue')) {
    const data = fs.readFileSync(file_or_dir, 'utf-8');
    this.addVueComponent(file_or_dir, data);
  } else if (file_or_dir.endsWith('.js')) {
    const data = fs.readFileSync(file_or_dir, 'utf-8');
    this.addScript(file_or_dir, data);
  }
};

Process.prototype.extractMessages = function(file_or_dir) {
  this.data = [];
  this.extract(file_or_dir);
  return this.data;
};

function extract() {
  const sourceDir = argv.dir;

  const process = new Process();
  const entries = Object.entries(process.extractMessages(sourceDir));

  const data = entries
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(item => item[1].toString())
    .join('\n');

  const options = {
    auth: {
      username: argv.user,
      password: argv.password
    },
    data
  };
  axios.put(`${baseUrl}/content/`, options)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`Process finished. ${entries.length} messages extracted`);
    })
    .catch(error => {
      if (error.response) {
        // eslint-disable-next-line no-console
        console.error(`Cannot submit extracted messages: ${error.response.statusText} (${error.response.status})`);
      } else if (error.request) {
        // eslint-disable-next-line no-console
        console.error('Cannot submit extracted messages: ' + error.request);
      } else {
        // eslint-disable-next-line no-console
        console.log('Cannot submit extracted messages:', error.message);
      }
  });
}

function getTranslation(lang, callback) {
  const options = {
    auth: {
      username: argv.user,
      password: argv.password
    }
  };
  axios.get(`${baseUrl}/translation/${lang}/?mode=reviewed&file`, options)
    .then(response => callback(response.data))
    .catch(error => {
      if (error.response) {
        // eslint-disable-next-line no-console
        console.error(`Error retrieving translations:  ${error.response.statusText} (${error.response.status})`);
      } else if (error.request) {
        // eslint-disable-next-line no-console
        console.error('Error retrieving translations: ' + error.request);
      } else {
        // eslint-disable-next-line no-console
        console.log('Error retrieving translations:', error.message);
      }
  });
}

function convert(lang) {
  // eslint-disable-next-line no-console
  console.log('Requesting', lang, 'from transifex');

  getTranslation(lang, (data) => {
    // save indented json : need to parse/stringify...
    const output = JSON.parse(gettextCompiler.convertPo([data]));
    fs.writeFileSync(`src/translations/dist/${lang}.json`, JSON.stringify(output, null, 2));

    // eslint-disable-next-line no-console
    console.log(lang, 'finished');
    // Todo : create a Pull Request on Github
  });
}

function compile() {
  ['fr', 'en', 'es', 'eu', 'de', 'it', 'ca'].forEach(convert);
}

const argv = require('yargs')
  .option('password', {
    alias: 'p',
    requiresArg: true,
    type: 'string',
    describe: 'Specify password to connect to Transifex API',
    demandOption: true
  })
  .option('user', {
    alias: 'u',
    requiresArg: true,
    type: 'string',
    default: 'api',
    describe: 'Specifiy user to connect to Transifex API'
  })
  .option('dir', {
    alias: 'd',
    requiresArg: true,
    type: 'string',
    default: 'src',
    describe: 'Extract messages from given directory'
  })
  .command('extract', 'Extract messages from code and submit them to transifex')
  .command('compile', 'Retrive messages from Transifex and generate po files')
  .version('1.0.0')
  .argv;

switch (argv._[0]) {
case 'extract':
  extract();
  break;
case 'compile':
  compile();
  break;
default:
  console.error(`Unknown command: ${argv._[0]}`); // eslint-disable-line no-console
}
