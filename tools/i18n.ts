/*
 * Find, recover and push missing translations, so they survive the next Transifex sync.
 *
 * Transifex is the source of truth for src/translations/<lang>.json: the retrieve-i18n workflow
 * (c2corg/transifex-pull-request-action) regenerates those files from Transifex, so a translation
 * only added to the JSON file is erased by the next sync. This tool closes the loop:
 *
 *   node tools/i18n.ts missing <lang> [--transifex <po>] [--out file] [--from-ref <git ref>]... [--from-history <since>]
 *       Extracts the .pot from the sources, and lists the messages without <lang> translation in a
 *       worklist file (default: /tmp/i18n-<lang>.json). --transifex: the current <lang> translations
 *       downloaded from Transifex (.po file, "default" mode), the accurate source. Without it,
 *       src/translations/<lang>.json is used: the sync drops translations identical to their message, which
 *       then look missing.
 *       --from-ref / --from-history: fill the worklist with translations found in older versions of
 *       src/translations/<lang>.json (e.g. a PR branch, or the commits since a date), newest first.
 *
 *   node tools/i18n.ts apply <worklist>
 *       Merges the worklist translations into src/translations/<lang>.json, as the sync would write them.
 *
 *   node tools/i18n.ts po <worklist> [--out file]
 *       Writes the worklist translations as a .po file (default: /tmp/i18n-<lang>.po), to upload to the
 *       Transifex resource (e.g. with the Transifex MCP server). It only holds the worklist messages: the
 *       other translations on Transifex are left untouched.
 *
 * A worklist entry: { msgid, msgctxt (null if none), files (where the message is used), translation, origin }.
 * Entries with an empty translation are ignored by `apply` and `po`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

import extractMessages from './extract-messages.ts';

const POT_FILE = 'src/translations/c2corg_ui-client.pot';
const NO_CONTEXT = '$$noContext';

export type PoEntry = { msgctxt: string | null; msgid: string; msgstr: string; files: string[] };
export type LocaleMessages = Record<string, string | Record<string, string>>;
export type WorklistEntry = {
  msgid: string;
  msgctxt: string | null;
  files: string[];
  translation: string;
  origin: string | null;
};
export type Worklist = { lang: string; entries: WorklistEntry[] };

const unescapePo = (value: string): string =>
  value.replace(/\\(.)/g, (_, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c);

const escapePo = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');

/** Parses a .po/.pot file (no plural forms: this project does not use them). The header entry is skipped. */
export function parsePo(content: string): PoEntry[] {
  const entries: PoEntry[] = [];
  let current: PoEntry = { msgctxt: null, msgid: '', msgstr: '', files: [] };
  let field: 'msgctxt' | 'msgid' | 'msgstr' | null = null;

  const flush = () => {
    if (current.msgid) {
      entries.push(current);
    }
    current = { msgctxt: null, msgid: '', msgstr: '', files: [] };
    field = null;
  };

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    const keyword = /^(msgctxt|msgid|msgstr)\s+"(.*)"$/.exec(line);
    // an entry ends with its msgstr: anything but a continuation line starts the next one
    if (field === 'msgstr' && !line.startsWith('"')) {
      flush();
    }
    if (keyword) {
      field = keyword[1] as 'msgctxt' | 'msgid' | 'msgstr';
      current[field] = unescapePo(keyword[2]);
    } else if (field && /^".*"$/.test(line)) {
      current[field] += unescapePo(line.slice(1, -1));
    } else if (line.startsWith('#:')) {
      current.files.push(...line.slice(2).trim().split(/\s+/));
    }
  }
  flush();

  return entries;
}

export function lookup(messages: LocaleMessages, msgid: string, msgctxt: string | null): string | undefined {
  const value = messages[msgid];
  if (typeof value === 'string') {
    return msgctxt === null ? value : undefined;
  }
  return value?.[msgctxt ?? NO_CONTEXT];
}

/** Adds a translation to the locale messages, with the same rules as c2corg/transifex-pull-request-action */
export function setTranslation(messages: LocaleMessages, msgid: string, msgctxt: string | null, msgstr: string) {
  if (!msgstr.trim() || msgstr.trim() === msgid) {
    // the sync drops them: the UI shows the message itself
    return;
  }
  const current = messages[msgid];
  if (msgctxt === null) {
    if (typeof current === 'object') {
      current[NO_CONTEXT] = msgstr;
    } else {
      messages[msgid] = msgstr;
    }
  } else {
    const contexts = typeof current === 'object' ? current : current ? { [NO_CONTEXT]: current } : {};
    contexts[msgctxt] = msgstr;
    messages[msgid] = contexts;
  }
}

type Nested = { [key: string]: string | Nested };

export const sortKeys = <T extends Nested>(obj: T): T =>
  Object.fromEntries(
    Object.keys(obj)
      .sort()
      .map((key) => [key, typeof obj[key] === 'string' ? obj[key] : sortKeys(obj[key] as Nested)])
  ) as T;

/** Builds the .po file uploaded to Transifex for the translated entries of a worklist */
export function buildPo(worklist: Worklist): { content: string; count: number } {
  const lines = [
    'msgid ""',
    'msgstr ""',
    `"Language: ${worklist.lang}\\n"`,
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '',
  ];
  let count = 0;
  for (const entry of worklist.entries) {
    if (!entry.translation.trim()) {
      continue;
    }
    if (entry.msgctxt !== null) {
      lines.push(`msgctxt "${escapePo(entry.msgctxt)}"`);
    }
    lines.push(`msgid "${escapePo(entry.msgid)}"`, `msgstr "${escapePo(entry.translation)}"`, '');
    count += 1;
  }
  return { content: lines.join('\n'), count };
}

const localeFile = (lang: string) => `src/translations/${lang}.json`;

function readLocale(content: string, lang: string): LocaleMessages {
  return (JSON.parse(content) as Record<string, LocaleMessages>)[lang] ?? {};
}

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const options: Record<string, string[]> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const name = argv[i].slice(2);
      const value = argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? 'true' : argv[++i];
      (options[name] ??= []).push(value);
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, options };
}

async function missing(lang: string, options: Record<string, string[]>) {
  extractMessages('src', POT_FILE);
  const pot = parsePo(readFileSync(POT_FILE, 'utf8'));

  let isTranslated: (entry: PoEntry) => boolean;
  if (options.transifex) {
    const translated = new Set(
      parsePo(readFileSync(options.transifex[0], 'utf8'))
        .filter((entry) => entry.msgstr.trim())
        .map((entry) => `${entry.msgctxt}\u0004${entry.msgid}`)
    );
    isTranslated = (entry) => translated.has(`${entry.msgctxt}\u0004${entry.msgid}`);
  } else {
    console.warn(
      `no --transifex file: using ${localeFile(lang)}, translations identical to their message look missing`
    );
    const messages = readLocale(readFileSync(localeFile(lang), 'utf8'), lang);
    isTranslated = (entry) => lookup(messages, entry.msgid, entry.msgctxt) !== undefined;
  }

  const entries: WorklistEntry[] = pot
    .filter((entry) => !isTranslated(entry))
    .map(({ msgid, msgctxt, files }) => ({ msgid, msgctxt, files, translation: '', origin: null }));

  const refs = [...(options['from-ref'] ?? [])];
  for (const since of options['from-history'] ?? []) {
    refs.push(
      ...git('log', '--format=%H', `--since=${since}`, '--all', '--', localeFile(lang)).split('\n').filter(Boolean)
    );
  }
  for (const ref of refs) {
    let messages: LocaleMessages;
    try {
      messages = readLocale(git('show', `${ref}:${localeFile(lang)}`), lang);
    } catch {
      console.warn(`skip ${ref}: no ${localeFile(lang)}`);
      continue;
    }
    for (const entry of entries) {
      const translation = entry.translation ? undefined : lookup(messages, entry.msgid, entry.msgctxt);
      if (translation?.trim()) {
        entry.translation = translation;
        entry.origin = ref;
      }
    }
  }

  const out = options.out?.[0] ?? `/tmp/i18n-${lang}.json`;
  writeFileSync(out, JSON.stringify({ lang, entries } satisfies Worklist, null, 2) + '\n');
  const recovered = entries.filter((entry) => entry.translation).length;
  // eslint-disable-next-line no-console
  console.log(`${entries.length} messages without ${lang} translation, ${recovered} recovered from git → ${out}`);
}

function apply(worklist: Worklist) {
  const file = localeFile(worklist.lang);
  const content = readFileSync(file, 'utf8');
  const messages = readLocale(content, worklist.lang);
  let count = 0;
  for (const entry of worklist.entries) {
    if (entry.translation.trim()) {
      setTranslation(messages, entry.msgid, entry.msgctxt, entry.translation);
      count += 1;
    }
  }
  const trailingNewline = content.endsWith('\n') ? '\n' : '';
  writeFileSync(file, JSON.stringify(sortKeys({ [worklist.lang]: messages }), null, 2) + trailingNewline);
  // eslint-disable-next-line no-console
  console.log(`${count} translations merged into ${file}`);
}

function po(worklist: Worklist, out: string) {
  const { content, count } = buildPo(worklist);
  writeFileSync(out, content);
  // eslint-disable-next-line no-console
  console.log(`${count} translations → ${out}`);
}

async function main(argv: string[]) {
  const { positional, options } = parseArgs(argv);
  const [command, arg] = positional;
  const readWorklist = () => JSON.parse(readFileSync(arg, 'utf8')) as Worklist;

  if (command === 'missing' && arg) {
    await missing(arg, options);
  } else if (command === 'apply' && arg) {
    apply(readWorklist());
  } else if (command === 'po' && arg) {
    const worklist = readWorklist();
    po(worklist, options.out?.[0] ?? `/tmp/i18n-${worklist.lang}.po`);
  } else {
    console.error(
      'Usage:\n' +
        '  node tools/i18n.ts missing <lang> [--transifex <po>] [--out file] [--from-ref <ref>]... [--from-history <since>]\n' +
        '  node tools/i18n.ts apply <worklist>\n' +
        '  node tools/i18n.ts po <worklist> [--out file]'
    );
    process.exit(1);
  }
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
