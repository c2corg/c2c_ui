import { describe, expect, it } from 'vitest';

import ItinevertResultView from '@/components/itinevert/ItinevertResultView';
import DocumentsView from '@/views/documents/DocumentsView';

// The documents table is loaded lazily. Vue 3 needs an async component (defineAsyncComponent): a plain function
// returning the import, as Vue 2 accepted, is not rendered (the table stayed empty).
describe('lazy documents table', () => {
  it.each([
    ['DocumentsView', DocumentsView],
    ['ItinevertResultView', ItinevertResultView],
  ])('is an async component in %s', (name, view) => {
    expect(view.components.DocumentsTable.__asyncLoader).toBeTypeOf('function');
  });
});
