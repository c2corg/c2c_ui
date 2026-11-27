// The line by line, then word by word, differences of two texts, as DiffView shows them
import {
  type Diff as DiffPart,
  diffCharsToLines,
  diffCleanupSemantic,
  diffLinesToChars,
  diffMain,
} from 'diff-match-patch-es';

// a diff of diff-match-patch: (mode, text) pairs, mode being -1 (deletion), 0 (unchanged) or 1 (addition)
type Diff = DiffPart[];
type DiffCallback = (oldPart: string | null, newPart: string | null, isIdentical: boolean) => void;

// words (with their combining marks), runs of spaces, and single other characters (punctuation, markdown signs)
const WORDS = /[\p{L}\p{M}\p{N}_]+/gu;
const TOKENS = /[\p{L}\p{M}\p{N}_]+|\s+|[^\p{L}\p{M}\p{N}_\s]/gu;

// the UTF-16 code units free to encode tokens: all but the surrogate halves (0xD800 to 0xDFFF), which
// could be read back in pairs
const MAX_TOKENS = 0x10000 - 0x800;
const tokenCode = (n: number) => String.fromCharCode(n < 0xd800 ? n : n + 0x800);
const tokenIndex = (code: number) => (code < 0xd800 ? code : code - 0x800);

// two old and new lines less similar than this are shown as a deletion and an addition, not as a change
const MIN_SIMILARITY = 0.5;

// a line of at least this many words, all kept in another line, is similar to it
const MIN_CONTAINED_WORDS = 4;

// above this many old × new lines in one changed block, lines are paired in order instead of by similarity
const MAX_ALIGNMENT_CELLS = 250_000;

// the word by word differences of two lines: diff-match-patch on words encoded as single characters,
// so that a change shows whole words, then semantic cleanup merges small identical parts into the change;
// letter by letter when the two lines have more distinct tokens than characters to encode them
export const diffWords = function (oldText: string, newText: string): Diff {
  const tokens: string[] = [];
  const codes = new Map<string, string>();
  const encode = (text: string) =>
    (text.match(TOKENS) ?? [])
      .map((token) => {
        let code = codes.get(token);
        if (code === undefined) {
          code = tokenCode(tokens.length);
          codes.set(token, code);
          tokens.push(token);
        }
        return code;
      })
      .join('');

  const oldCodes = encode(oldText);
  const newCodes = encode(newText);
  if (tokens.length > MAX_TOKENS) {
    const diff = diffMain(oldText, newText);
    diffCleanupSemantic(diff);
    return diff;
  }

  const diff = diffMain(oldCodes, newCodes, undefined, false);
  diffCleanupSemantic(diff);
  for (const part of diff) {
    let text = '';
    for (let n = 0; n < part[1].length; n++) {
      text += tokens[tokenIndex(part[1].charCodeAt(n))];
    }
    part[1] = text;
  }
  return diff;
};

// the words of a line, lowercased, with their counts
const wordCounts = function (line: string) {
  const counts = new Map<string, number>();
  for (const word of line.toLowerCase().match(WORDS) ?? []) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
};

// how similar two lines are, from 0 to 1: the share of their words in common (Dice coefficient), or
// the share of the words of the shorter line kept in the other one when it has enough words (so that a
// line with a text appended is still the same line), or whether they are equal when one has no word
// (blank lines, markdown separators)
const similarity = function (
  oldLine: string,
  newLine: string,
  oldWords: Map<string, number>,
  newWords: Map<string, number>
) {
  let oldSize = 0;
  let common = 0;
  for (const [word, count] of oldWords) {
    oldSize += count;
    common += Math.min(count, newWords.get(word) ?? 0);
  }
  let newSize = 0;
  for (const count of newWords.values()) {
    newSize += count;
  }
  if (oldSize === 0 || newSize === 0) {
    return oldLine.trim() === newLine.trim() ? 1 : 0;
  }
  const dice = (2 * common) / (oldSize + newSize);
  const shorter = Math.min(oldSize, newSize);
  return shorter >= MIN_CONTAINED_WORDS ? Math.max(dice, common / shorter) : dice;
};

// a row of a changed block: its old and new lines (undefined when there is none), and whether they are
// similar enough to show their word by word differences
export type LinePair = [oldLine: string | undefined, newLine: string | undefined, similar: boolean];

// pairs the old and new lines of a changed block: each old line with the most similar new line, keeping
// their order; between two such pairs, the lines without a similar counterpart are put side by side, as
// whole deleted and added lines, so that the block takes no more rows than its longest side
export const alignLines = function (oldLines: string[], newLines: string[]): LinePair[] {
  const k = oldLines.length;
  const m = newLines.length;

  const oldWords = oldLines.map(wordCounts);
  const newWords = newLines.map(wordCounts);
  const sim = (i: number, j: number) => similarity(oldLines[i], newLines[j], oldWords[i], newWords[j]);

  if (k === 0 || m === 0 || k * m > MAX_ALIGNMENT_CELLS) {
    return Array.from({ length: Math.max(k, m) }, (_, i): LinePair => [
      oldLines[i],
      newLines[i],
      i < k && i < m && sim(i, i) >= MIN_SIMILARITY,
    ]);
  }

  // best[i][j]: the highest total similarity pairing the first i old lines with the first j new lines
  const best = Array.from({ length: k + 1 }, () => new Float64Array(m + 1));
  const paired = Array.from({ length: k + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= k; i++) {
    for (let j = 1; j <= m; j++) {
      best[i][j] = Math.max(best[i - 1][j], best[i][j - 1]);
      const s = sim(i - 1, j - 1);
      if (s >= MIN_SIMILARITY && best[i - 1][j - 1] + s > best[i][j]) {
        best[i][j] = best[i - 1][j - 1] + s;
        paired[i][j] = 1;
      }
    }
  }

  // walk back from the end, keeping the unpaired lines met since the last pair
  const pairs: LinePair[] = [];
  let deleted: string[] = [];
  let added: string[] = [];
  const flush = () => {
    // deleted and added are in reverse order, as pairs: their last lines go side by side first
    const d = deleted.length;
    const a = added.length;
    for (let n = Math.max(d, a) - 1; n >= 0; n--) {
      pairs.push([deleted[d - 1 - n], added[a - 1 - n], false]);
    }
    deleted = [];
    added = [];
  };
  let i = k;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && paired[i][j]) {
      flush();
      pairs.push([oldLines[--i], newLines[--j], true]);
    } else if (j > 0 && (i === 0 || best[i][j - 1] >= best[i - 1][j])) {
      added.push(newLines[--j]);
    } else {
      deleted.push(oldLines[--i]);
    }
  }
  flush();
  return pairs.reverse();
};

export const hasChanged = function (oldVal: unknown, newVal: unknown) {
  // does oldVal equals to newVal ?
  // handle arrays and immutables values
  // and considerer that null equal to null, and nothing else

  if (Array.isArray(oldVal) || Array.isArray(newVal)) {
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  }

  if ((oldVal === null && newVal !== null) || (oldVal !== null && newVal === null)) {
    return true;
  }

  return oldVal !== newVal;
};

const computeDiff = function (diff: Diff, callback: DiffCallback) {
  // this function transform a diff from diff-match-patch
  //
  // it calls sequentially callback with three argument :
  //
  // * old part of diff
  // * new part of diff
  // * isIdentical (obvioulsy when old === new)
  //
  // if isIdentical is false, there are three use cases :
  //
  // * both part are not null : it means that a replacement has been made
  // * old part is null : it's an addition
  // * new part is null : it's a deletion
  //
  // Note about diff structure : it's an array of (mode, text) where mode can be :
  //
  // * -1 : means a deletion
  // * 0  : means that text has not been modified
  // * 1  : means an addition
  //
  // this structure has a particularity : deletion, if it exists, always precedes addition. So, the logic is :
  //
  // * if mode === 0 : callback(text, text, true)
  // * else if mode === 1 : next mode will be 0, so call callback(null, text, false)
  // * else if mode === -1 (last possibility) :
  //   * if next mode is 0, it means that an addition can't be linked to this deletion : callback(text, null, false)
  //   * else, next diff item can be linked to this deletion : callback(text, nextText, false)

  for (let i = 0; i < diff.length; i++) {
    if (diff[i][0] === 0) {
      // no modification, old part and new part are equals
      callback(diff[i][1], diff[i][1], true);
    } else if (diff[i][0] === 1) {
      // an addition, and there is no suppression
      callback(null, diff[i][1], false);
    } else if (diff[i][0] === -1) {
      if (i + 1 < diff.length && diff[i + 1][0] === 1) {
        // an added part follows this removed part
        callback(diff[i][1], diff[i + 1][1], false);
        i += 1;
      } else {
        // there is not added part that can be linked to this removed part
        callback(diff[i][1], null, false);
      }
    }
  }
};

// an Item is a small amount of text, with a flag that tell if this text has been modified, or not
class Item {
  constructor(
    public text: string | null | undefined,
    public isIdentical: boolean
  ) {}
}

// a row is a object with old and new part
// each part is an array of items
// isIdentical is obvious
// ellipsed is a UI flag : if true, w'ont be displayed.
//   it will be computed by Rows.computeEllipsisStates()
export class Row {
  oldPart: Item[] = [];
  newPart: Item[] = [];
  ellipsed = true;

  constructor(
    oldPart: string | undefined,
    newPart: string | undefined,
    public isIdentical: boolean,
    similar = true
  ) {
    if (isIdentical) {
      this.oldPart = [new Item(oldPart, true)];
      this.newPart = this.oldPart; // same object (reduce memory footprint)
    } else if (oldPart === undefined) {
      this.newPart.push(new Item(newPart, false));
    } else if (newPart === undefined) {
      this.oldPart.push(new Item(oldPart, false));
    } else if (!similar) {
      // a deleted line and an unrelated added line, side by side: their word differences would be noise
      this.oldPart.push(new Item(oldPart, false));
      this.newPart.push(new Item(newPart, false));
    } else {
      // two different row on the same location, let's compute a precise diff
      const diff = diffWords(oldPart, newPart);
      computeDiff(diff, this.addItem.bind(this));

      // a blank line changed into spaces, or the reverse, gives no part on one side: show it as an empty
      // line, not as an absent one
      if (this.oldPart.length === 0) {
        this.oldPart.push(new Item('', true));
      }
      if (this.newPart.length === 0) {
        this.newPart.push(new Item('', true));
      }
    }
  }

  // boolean, true if old part does not exists
  get isFakeOld() {
    return this.oldPart.length === 0;
  }

  // boolean, true if new part does not exists
  get isFakeNew() {
    return this.newPart.length === 0;
  }

  addItem(oldPart: string | null, newPart: string | null, isIdentical: boolean) {
    // this function is a callback for computeDiff
    // oldPart and newPart are a small amount of text
    if (isIdentical) {
      const item = new Item(oldPart, true);
      this.oldPart.push(item);
      this.newPart.push(item);
    } else {
      if (oldPart !== null) {
        this.oldPart.push(new Item(oldPart, false));
      }

      if (newPart !== null) {
        this.newPart.push(new Item(newPart, false));
      }
    }
  }
}

// simple array of Row() objects, with computation methods
export class Rows {
  items: Row[] = [];

  build(oldText: string, newText: string) {
    // compute a line diff
    const linesData = diffLinesToChars(oldText, newText);
    const diff = diffMain(linesData.chars1, linesData.chars2, undefined, false);
    diffCharsToLines(diff, linesData.lineArray);

    computeDiff(diff, this.add.bind(this));
  }

  add(oldPart: string | null, newPart: string | null, isIdentical: boolean) {
    // callback for computDiff()
    // oldPart and newPart are text containing EOLs and finishing with a last EOL
    // it performs a split on this text, and add equivalent rows
    // note that if oldPart is different from newPart, its lines are paired by similarity
    // (alignLines), so a Row object can be initialized with one of oldPart/newPart
    // argument equals to undefined
    const rows = this.items;

    if (isIdentical) {
      const rowTexts = oldPart!.split('\n');
      for (const rowText of rowTexts.slice(0, rowTexts.length - 1)) {
        rows.push(new Row(rowText, rowText, true));
      }
    } else {
      // the last element of the split is the empty text after the last EOL
      const oldLines = oldPart !== null ? oldPart.split('\n').slice(0, -1) : [];
      const newLines = newPart !== null ? newPart.split('\n').slice(0, -1) : [];
      for (const [oldLine, newLine, similar] of alignLines(oldLines, newLines)) {
        rows.push(new Row(oldLine, newLine, false, similar));
      }
    }
  }

  computeEllipsisStates() {
    // set Row.ellipsed to false on all rows where Row.isIdentical === false
    // and also on 2 surrouding rows
    // the idea is to display context rows on top and bottom of a modified row
    const rows = this.items;
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].isIdentical) {
        for (let j = Math.max(0, i - 2); j <= Math.min(rows.length - 1, i + 2); j++) {
          rows[j].ellipsed = false;
        }
      }
    }
  }
}

// the rows of a text field, grouped in blocks of rows shown or ellipsed
export type Block = { rows: Row[]; ellipsed: boolean };

// the blocks of the differences of two texts
export function diffBlocks(oldText: string, newText: string): Block[] {
  const rows = new Rows();
  rows.build(oldText, newText);
  rows.computeEllipsisStates();

  const blocks: Block[] = [{ rows: [], ellipsed: rows.items[0].ellipsed }];

  let currentBlock = blocks[0];

  for (const row of rows.items) {
    if (currentBlock.ellipsed !== row.ellipsed) {
      currentBlock = { rows: [], ellipsed: row.ellipsed };
      blocks.push(currentBlock);
    }
    currentBlock.rows.push(row);
  }

  return blocks;
}
