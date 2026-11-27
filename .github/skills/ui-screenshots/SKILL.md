---
name: ui-screenshots
description: Take screenshots of the UI at exact window sizes before and after a layout or CSS change, compare them, and pick some for the pull request. Use when changing styles, breakpoints, container queries or the shell (navigation, side menu, fixed elements), when asked for before/after screenshots, or to check a change has no unwanted visual regression.
---

# Before/after screenshots of a layout change

Tool: `node tools/screenshots.ts` (see its header for the options and the format of a shot). Work files go in
`/tmp/c2c-shots/`, never in the repository.

The goal is a sane behaviour at every width, not identical pixels: look at each DIFF, and explain it (the change,
or noise) before going on.

## 1. Serve the UI against the local API

- The local `api` (`http://localhost:6543`) answers every page without the HTTP 429 of the production API.
  Check it: `curl -s localhost:6543/health`. Without it, `--backend prod` works for a few pages.
- `npm run serve` (port 8080). On another port (`npx vite --port 8095 --strictPort`, then `--base
http://localhost:8095`), the tool turns off web security: the local API only allows the :8080 origin.
- The VS Code browser clamps the viewport to its panel: use the tool, not it, for exact sizes.

## 2. List the shots

A JSON array in `/tmp/c2c-shots/shots.json`. Cover, for each component touched:

- the widths around each breakpoint it depends on (375, 600, 700, 769, 900, 1024, 1100, 1216, 1300, 1700), and the
  widths where its own box is narrow (a 3/4 column, beside the side menu, beside a map);
- its states: open/closed, empty/full (`click`), and the data that changes its size (a long title, no result...).
  Documents of the local database: query the API (`curl 'localhost:6543/waypoints?wtyp=access&a=14274&limit=30'`);
- `element` for a component, the whole page for the shell (offsets of the navigation, pinned maps, sticky headers).

Measures beat images for offsets: a `log` script printing `getBoundingClientRect()` or `getComputedStyle()` values
gives a diff of numbers. To render a hidden state without data, `run` can add the markup, with the `data-v-` attribute
of the component for its scoped styles.

## 3. Shoot before, then after

```sh
git stash                      # or: git checkout origin/master -- <changed files>
node tools/screenshots.ts shoot /tmp/c2c-shots/shots.json /tmp/c2c-shots/before --base http://localhost:8095
git stash pop                  # or: git checkout HEAD -- <changed files>
node tools/screenshots.ts shoot /tmp/c2c-shots/shots.json /tmp/c2c-shots/after --base http://localhost:8095
node tools/screenshots.ts compare /tmp/c2c-shots/before /tmp/c2c-shots/after /tmp/c2c-shots/cmp
```

The dev server reloads the changed files: wait a second after `stash`/`pop`. Keep `before/`, and shoot again only
the shots of what changed (`--filter`).

Noise to ignore in a DIFF:

- a box of one icon at the top left (about 23,126 to 36,136): the animation of the side menu;
- the time fields (the current time), and the random image of the Itinévert banner;
- the tiles of a map still loading: give a longer `wait`.

To check what a browser without a feature gets (container queries on iOS 15), rename the container in the style,
shoot, and put it back.

## 4. In the pull request

Pick 2 to 4 side-by-side images of `cmp/` that show the fix (the bug before, the fix after), at a width where it
showed. GitHub has no API to attach images: push them to an orphan branch of your fork, in a repository of their
own, and link the raw files:

```sh
mkdir /tmp/c2c-pr-shots && cd /tmp/c2c-pr-shots && git init -q -b pr-<number>-shots
cp /tmp/c2c-shots/cmp/<chosen>.png . && git add . && git commit -qm "screenshots of c2corg/c2c_ui#<number>"
git push -f https://github.com/<you>/c2c_ui pr-<number>-shots
```

`![before | after](https://raw.githubusercontent.com/<you>/c2c_ui/pr-<number>-shots/<chosen>.png)`, with a line
saying the width and what to look at. Delete the branch once the PR is merged.
