import { readFileSync, writeFileSync } from 'node:fs';

// dist/health.json: the version of the build, for the health checks of the container
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

writeFileSync(new URL('../dist/health.json', import.meta.url), `{\n    "version": "${version}"\n  }`);
