import { afterEach, describe, expect, it, vi } from 'vitest';

import documentEditionViewMixin from './document-edition-view-mixin';

const leave = (modified) => documentEditionViewMixin.beforeRouteLeave.call({ modified, $gettext: (text) => text });

// leaving an edit form with unsaved changes asks for a confirmation: false cancels the navigation
describe('document edition view, leaving the form', () => {
  afterEach(() => vi.restoreAllMocks());

  it('leaves without asking when nothing changed', () => {
    const confirm = vi.spyOn(window, 'confirm');

    expect(leave(false)).not.toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('stays when the user cancels, leaves when they confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(leave(true)).toBe(false);
    expect(leave(true)).not.toBe(false);
  });
});
