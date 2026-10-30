// The line by line, then word by word, differences of two texts, as DiffView shows them
import { type Diff as DiffPart, diffCharsToLines, diffLinesToChars, diffMain } from 'diff-match-patch-es';

// a diff of diff-match-patch: (mode, text) pairs, mode being -1 (deletion), 0 (unchanged) or 1 (addition)
type Diff = DiffPart[];
type DiffCallback = (oldPart: string | null, newPart: string | null, isIdentical: boolean) => void;

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
    public isIdentical: boolean
  ) {
    if (isIdentical) {
      this.oldPart = [new Item(oldPart, true)];
      this.newPart = this.oldPart; // same object (reduce memory footprint)
    } else if (oldPart === undefined) {
      this.newPart.push(new Item(newPart, false));
    } else if (newPart === undefined) {
      this.oldPart.push(new Item(oldPart, false));
    } else {
      // two different row on the same location, let's compute a precise diff
      const diff = diffMain(oldPart, newPart);
      computeDiff(diff, this.addItem.bind(this));
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
      if (oldPart !== undefined) {
        this.oldPart.push(new Item(oldPart, false));
      }

      if (newPart !== undefined) {
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
    // note that if oldPart is different from newPart, and if there is not the same
    // quantity of EOL, Row object can be initialized with one of oldPart/newPart
    // argument equals to undefined
    const rows = this.items;

    if (isIdentical) {
      const rowTexts = oldPart!.split('\n');
      for (const rowText of rowTexts.slice(0, rowTexts.length - 1)) {
        rows.push(new Row(rowText, rowText, true));
      }
    } else {
      const oldLines = oldPart !== null ? oldPart.split('\n') : [];
      const newLines = newPart !== null ? newPart.split('\n') : [];
      for (let i = 0; i < Math.max(oldLines.length - 1, newLines.length - 1); i++) {
        rows.push(new Row(oldLines[i], newLines[i], false));
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
