// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

// tools/extract-messages.js: the messages of the sources, for the .pot file sent to Transifex
const extractMessages = createRequire(import.meta.url)('../../tools/extract-messages.js');

describe('extract-messages', () => {
  it('extracts the messages of the JavaScript and TypeScript modules, not of the type declarations', () => {
    const dir = mkdtempSync(join(tmpdir(), 'extract-messages-'));
    writeFileSync(join(dir, 'module.js'), "$gettext('from javascript');");
    writeFileSync(join(dir, 'module.ts'), "app.config.globalProperties.$gettext('from typescript', 'some context');");
    writeFileSync(join(dir, 'types.d.ts'), "declare const x: '$gettext(\\'from a declaration\\')';");
    const pot = join(dir, 'messages.pot');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    extractMessages(dir, pot);

    const content = readFileSync(pot, 'utf8');
    expect(content).toContain('msgid "from javascript"');
    expect(content).toContain('msgctxt "some context"\nmsgid "from typescript"');
    expect(content).not.toContain('from a declaration');
  });
});
