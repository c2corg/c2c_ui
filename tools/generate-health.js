const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

async function main() {
  const pkg = require(path.resolve(__dirname, '../package.json'));
  const version = pkg.version;

  const content = `{
    "version": "${version}"
  }`;

  await promisify(fs.writeFile)(path.resolve(__dirname, '../dist', 'health.json'), content);
}

main().catch(err => {
  if (err) {
    throw err;
  }
});
