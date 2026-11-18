---
name: i18n-translate
description: Find the UI messages without translation for a language, recover lost translations from git, translate the rest, then push them to Transifex and src/translations/<lang>.json so the next Transifex sync does not erase them. Use when translations were erased by an "Update translations from transifex" PR, when new messages need translations, or when asked to fill/push missing translations.
---

# Missing translations → Transifex

Transifex is the source of truth: the `retrieve-i18n` workflow regenerates `src/translations/<lang>.json` from
the Transifex resource `main` (project `camptocamp-association/c2corg_ui`). A translation only written in the JSON
file is **erased by the next sync**: it must reach Transifex. New messages reach Transifex through the `push-i18n`
CI job, once merged on `master`: only messages used on `master` can get translations.

Tools: `node tools/i18n.ts` (see its header) and the Transifex MCP server (`https://mcp.transifex.ai/mcp`, OAuth).
Work files go in `/tmp/c2c-i18n/`, never in the repository. Below, `<lang>` is a Transifex language code (`fr`, `de`...).

## 1. Download the current translations

`transifex-download_file` with `organization: camptocamp-association`, `project: c2corg_ui`, and
`files: [{ resource: main, language: <lang>, mode: default, path: /tmp/c2c-i18n/<lang>.po }]`, then run the
returned command. Do not read the downloaded file: the tool parses it.

## 2. List the missing messages

```sh
node tools/i18n.ts missing <lang> --transifex /tmp/c2c-i18n/<lang>.po --out /tmp/c2c-i18n/worklist-<lang>.json \
  [--from-ref <git ref>]... [--from-history <since>]
```

- It extracts the `.pot` from the sources (`src/translations/c2corg_ui-client.pot`, not committed) and lists the
  messages untranslated on Transifex. Check the count against `transifex-get_resource_language_stats`
  (resource `main`): `untranslated_strings` must match. The website shows project totals, `main` + `sports`
  (`sports` is a separate resource, not synced by this repository).
- `--from-ref` / `--from-history` recover translations from older versions of `<lang>.json` before writing new
  ones. Translations written in a PR are typically lost after it merges: pass the PR heads
  (`git fetch origin pull/<n>/head:refs/pr/<n>`, then `--from-ref refs/pr/<n>`), including closed PRs of the same
  stack, and `--from-history <date>`. Refs are tried in order, the first one with a translation wins.

## 3. Translate the rest

In the worklist, each entry with an empty `translation` needs one; set `origin` to `"llm"` on those you write.

- Read `files` to see how the message is used (button, title, error...) and `msgctxt` for its context.
- Keep the vocabulary of the existing translations: grep `src/translations/<lang>.json` for the same words
  (e.g. fr: sortie, itinéraire, point de passage, topo, Mes topos, hors ligne), and the style of the recovered
  entries (fr: `’` apostrophe, a space before `:` `?` `!`, « » quotes, imperative for actions).
- Keep HTML entities such as `&quot;` as they are. Never change `msgid` or `msgctxt`.
- Show the user the new translations (not the recovered ones) before going further.

## 4. Write them into the repository

```sh
node tools/i18n.ts apply /tmp/c2c-i18n/worklist-<lang>.json
```

`git diff src/translations/<lang>.json` must only add entries (same format as the sync: sorted keys, contexts
nested under the message, translations identical to the message dropped).

## 5. Push them to Transifex

```sh
node tools/i18n.ts po /tmp/c2c-i18n/worklist-<lang>.json --out /tmp/c2c-i18n/upload-<lang>.po
wc -c < /tmp/c2c-i18n/upload-<lang>.po; shasum -a 256 /tmp/c2c-i18n/upload-<lang>.po
```

Then `transifex-upload_translation` with `files: [{ resource: main, language: <lang>, i18n_format: PO,
path: upload-<lang>.po, bytes, sha256 }]`. It returns a preview: show it with the counts (recovered / new), and
**wait for the user's explicit yes** before calling it again with `confirm: true`, the `confirmation_id` and the
same `files`. Run the returned `curl` command from `/tmp/c2c-i18n`. Expect `"created": <count>, "updated": 0`:
the file only holds messages untranslated on Transifex.

Check `transifex-get_resource_language_stats` again: `untranslated_strings` should be 0 (or what was skipped).

## 6. Pull request

Commit `src/translations/<lang>.json` on a branch from `origin/master` (never the `.pot`), title
`fix(i18n): ...`, and list in the description where the translations come from (git refs, new ones).
