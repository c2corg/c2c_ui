import { describe, expect, it } from 'vitest';

import DocumentsView from '@/views/documents/DocumentsView';

// The documents table is loaded lazily. Vue 3 needs an async component (defineAsyncComponent): a plain function
// returning the import, as Vue 2 accepted, is not rendered (the table stayed empty).
describe('lazy documents table', () => {
  it('is an async component in DocumentsView', () => {
    expect(DocumentsView.components.DocumentsTable.__asyncLoader).toBeTypeOf('function');
  });
});
