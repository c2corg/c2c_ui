/*
 * The quality of an outing computed again once images were added to it: the images count in its quality
 * (js/document-quality.ts), but they are added from the outing page, after the outing was saved.
 */

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { isEditable } from '@/js/composables/editable';
import { computeQuality } from '@/js/document-quality';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type User = { readonly isModerator: boolean; id: number | null };

/**
 * Save the outing with its quality computed again, once `imageIds` were added to it, when it changes.
 *
 * The quality is changed only when the user may edit the outing, and when it was computed: the quality an author chose
 * (another one than computed before the images, or "great") is kept. Return the new quality, or null when unchanged.
 */
export async function refreshOutingQuality(
  outing: C2cDocument,
  lang: string,
  imageIds: number[],
  user: User,
  comment: string
): Promise<string | null> {
  if (outing.type !== 'o' || !isEditable(outing, 'outing', user, true)) {
    return null;
  }

  const service = c2c.outing as DocumentService;
  // the outing as the edition form gets it: it is saved as it is
  const { data } = await service.get(outing.document_id!, lang);
  const document = data as C2cDocument;
  const locale = document.locales?.[0];
  if (!locale || document.quality === 'great') {
    return null;
  }

  const added = new Set(imageIds);
  const images = document.associations?.images ?? [];
  const before = computeQuality(
    {
      ...document,
      associations: { ...document.associations, images: images.filter((image) => !added.has(image.document_id!)) },
    },
    locale
  );
  const after = computeQuality(document, locale);

  if (before !== document.quality || after === document.quality) {
    // chosen by the author, or unchanged
    return null;
  }

  document.quality = after;
  await service.save(document as { document_id: number }, comment);
  return after;
}
