// The helpers of the moderation page of the deleted documents

import type { RouteLocationRaw } from 'vue-router';

import constants from '@/js/constants';
import type { DocumentUtils } from '@/js/vue-plugins/document-utils';

const DAY = 24 * 60 * 60 * 1000;

/** The page of a document (in a language, if given) */
// a document of a moderation list: a route with the title of its main waypoint before its title, as elsewhere
export type ListedDocument = {
  document_id: number;
  document_type: string;
  title: string | null;
  title_prefix?: string | null;
};

export function documentTitle(documentUtils: DocumentUtils, doc: ListedDocument): string {
  const { document_type: type, title, title_prefix } = doc;
  return documentUtils.getDocumentTitle({ type, title, title_prefix }) || '#' + doc.document_id;
}

export function documentRoute(letterType: string, documentId: number, lang?: string | null): RouteLocationRaw {
  return { name: constants.letterToDocumentType[letterType], params: { id: documentId, ...(lang ? { lang } : {}) } };
}

/** The types of the documents a moderator can delete (as the API; not coverages, unknown here), for the filter */
export const DELETABLE_TYPES = ['waypoint', 'route', 'outing', 'image', 'article', 'book', 'xreport'];

/** The days left before a deleted document can no longer be restored, at least 0 */
export function daysLeft(expiresAt: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / DAY));
}

/** The fields given by the API as dates (formatted as such) */
export const DATE_FIELDS = new Set(['date_start', 'date_end', 'date', 'date_time']);

/** The fields given by the API as elevations, in meters */
export const ELEVATION_FIELDS = new Set(['elevation', 'elevation_max']);
