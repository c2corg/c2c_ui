import { describe, expect, it, vi } from 'vitest';

import Selection from './selection';

const selectionOf = (value: string, start: number, end = start) => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setSelectionRange(start, end);
  const onInput = vi.fn();
  return { textarea, onInput, selection: new Selection(textarea, onInput) };
};

describe('Selection', () => {
  it('surrounds the selected text, keeps it selected and passes the new text', () => {
    const { textarea, onInput, selection } = selectionOf('a bold word', 2, 6);

    selection.setText(selection.text, '**', '**');

    expect(textarea.value).toBe('a **bold** word');
    expect(selection.text).toBe('bold');
    expect(onInput).toHaveBeenCalledWith('a **bold** word');
  });

  it('knows the tags around the selection', () => {
    const { selection } = selectionOf('a **bold** word', 4, 8);

    expect(selection.isSurroundedBy('**', '**')).toBe(true);
    expect(selection.isSurroundedBy('_', '_')).toBe(false);
  });

  it('expands to the entire lines, and adds or removes a prefix to each', () => {
    const { textarea, selection } = selectionOf('first\nsecond\nthird', 8, 15);

    selection.expandToEntireLine();
    expect(selection.text).toBe('second\nthird');

    selection.addLinePrefix('* ');
    expect(textarea.value).toBe('first\n* second\n* third');
    expect(selection.linesStartsWith('* ')).toBe(true);

    selection.removeLinePrefix('* ');
    expect(textarea.value).toBe('first\nsecond\nthird');
  });

  it('replaces in the selected text', () => {
    const { textarea, selection } = selectionOf('## Title', 0, 8);

    selection.replace(/^#+ */, '');

    expect(textarea.value).toBe('Title');
  });
});
