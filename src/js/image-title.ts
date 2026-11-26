/*
 * Changing the title of an image without its edit form: from the image viewer, and from the uploader when the user
 * sends again a photo the document already has (often to give it another title, which made duplicates).
 */

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { isEditable } from '@/js/composables/editable';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type User = { readonly isModerator: boolean; readonly isLogged?: boolean; id: number | null };

// what the image lists of the API give: enough to recognise the same photo
export type ListedImage = {
  document_id?: number;
  width?: number | null;
  height?: number | null;
  date_time?: string | null;
  camera_name?: string | null;
  locales?: { lang?: string; title?: string | null }[];
};

const sameInstant = (a: string, b: string) => {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isNaN(ta) || Number.isNaN(tb) ? a === b : ta === tb;
};

/**
 * The image of `images` that is the same photo as `uploaded`, else undefined: same stored size and same time of the
 * shot (EXIF), and the same camera when both have one. A photo without a time of shot is never matched: two drawings or
 * screenshots of the same size are not the same image. The rule of the duplicates the moderators see, without the file
 * size, which the lists don't give.
 */
export function findSamePhoto<T extends ListedImage>(uploaded: ListedImage, images: T[]): T | undefined {
  if (!uploaded.date_time || !uploaded.width || !uploaded.height) {
    return undefined;
  }
  return images.find(
    (image) =>
      image.width === uploaded.width &&
      image.height === uploaded.height &&
      !!image.date_time &&
      sameInstant(image.date_time, uploaded.date_time!) &&
      (!image.camera_name || !uploaded.camera_name || image.camera_name === uploaded.camera_name)
  );
}

// the language of the title the user sees: the one of the list, else the first one of the image
export const titleLang = (image: ListedImage & { available_langs?: string[] | null }, fallback: string) =>
  image.locales?.[0]?.lang ?? image.available_langs?.[0] ?? fallback;

/** The image as its edit form gets it, with whether the user may change it (personal: its creator, or a moderator) */
export async function loadEditableImage(documentId: number, lang: string, user: User) {
  const { data } = await (c2c.image as DocumentService).get(documentId, lang);
  const image = data as C2cDocument & { image_type?: string | null; creator?: { user_id: number } | null };
  const editable = user.isLogged !== false && user.id !== null && isEditable(image, 'image', user, true);
  return { image, editable };
}

/** Save `image` (from loadEditableImage) with another title in its language. Its associations are left as they are. */
export async function saveImageTitle(image: C2cDocument, title: string, comment: string) {
  const locale = image.locales?.[0];
  if (!locale) {
    throw new Error('image without a locale in this language');
  }
  locale.title = title;
  // without associations, the API leaves them as they are
  const document = { ...image };
  delete document.associations;
  await (c2c.image as DocumentService).save(document as { document_id: number }, comment);
}
