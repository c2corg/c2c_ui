// The areas the list opens with when the link names none: the preferred areas of the c2c account for a logged-in user
// (as the "My preferences" button of the lists does), the ones the visitor remembered in the browser otherwise.
import { readDefaultAreaIds } from './metaskirando-storage';
import { toId } from './text-filter';

import c2c from '@/js/apis/c2c';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

/** The default areas: documents when the preferences give them, otherwise only ids (the page loads the titles) */
export async function loadDefaultAreas(isLogged: boolean): Promise<{ ids: number[]; documents: C2cDocument[] }> {
  if (isLogged) {
    try {
      const preferences = (await c2c.userProfile.preferences.get()).data as { areas?: C2cDocument[] };
      const documents = (preferences.areas ?? []).filter((area) => toId(area.document_id) !== null);
      return { ids: documents.map((area) => area.document_id!), documents };
    } catch {
      // the list opens without areas
      return { ids: [], documents: [] };
    }
  }
  return { ids: readDefaultAreaIds(), documents: [] };
}
