/*
 * The images of an outing located on its GPS track (#4259), once uploaded: those without a location of their own sit on
 * the location the outing had when they were added (js/geo/locate-images.ts).
 */
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { isEditable } from '@/js/composables/editable';
import { locateImages, readTrack } from '@/js/geo/locate-images';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type User = { readonly isModerator: boolean; id: number | null };

type Outing = C2cDocument & { date_start?: string | null; date_end?: string | null };

// the versions of the outing read for its former locations: its first ones and its last ones
const MAX_VERSIONS = 30;

/** Whether the outing has a track with the times of its points, to locate its images on */
export const hasTimedTrack = (outing: Outing) => readTrack(outing.geometry?.geom_detail).length > 1;

/** The locations an image added to the outing without its own got: the outing's (now and before) and its routes' */
export async function defaultLocations(outing: Outing, lang: string): Promise<string[]> {
  const geoms = [outing.geometry?.geom, ...(outing.associations?.routes ?? []).map((route) => route.geometry?.geom)];
  const service = c2c.outing as DocumentService;
  try {
    const { data } = await service.getHistory(outing.document_id!, lang);
    let versions = (data as { versions: { version_id: number }[] }).versions;
    if (versions.length > MAX_VERSIONS) {
      versions = [...versions.slice(0, MAX_VERSIONS / 2), ...versions.slice(-MAX_VERSIONS / 2)];
    }
    const former = await Promise.all(
      versions.map(async ({ version_id }) => {
        try {
          const { data } = await service.getVersion(outing.document_id!, lang, version_id);
          return (data as { document?: C2cDocument }).document?.geometry?.geom;
        } catch {
          return undefined;
        }
      })
    );
    geoms.push(...former);
  } catch {
    // the current locations only
  }
  return [...new Set(geoms.filter((geom): geom is string => Boolean(geom)))];
}

/**
 * Save the images of the outing the user may edit with their location on its track. Return the images located, with
 * their new location (also set on the associations of the outing, for its map). minFit: see locateImages().
 */
export async function locateOutingImages(
  outing: Outing,
  lang: string,
  user: User,
  comment: string,
  { minFit = 0 } = {}
) {
  const track = readTrack(outing.geometry?.geom_detail);
  const associated = outing.associations?.images ?? [];
  if (track.length < 2 || !associated.length) {
    return [];
  }

  const service = c2c.image as DocumentService;
  const [defaults, images] = await Promise.all([
    defaultLocations(outing, lang),
    // all the images, also those with a location: they tell the clock shift of their camera
    // in a lang it has, so that it is saved with that locale
    Promise.all(
      associated.map(async (image) => {
        const langs = image.available_langs ?? [];
        const imageLang = langs.includes(lang) ? lang : (langs[0] ?? lang);
        return (await service.get(image.document_id!, imageLang)).data;
      })
    ),
  ]);
  const documents = images as unknown as (C2cDocument & {
    date_time?: string | null;
    camera_name?: string | null;
    elevation?: number | null;
  })[];

  const locations = locateImages(
    documents.map((document) => ({ ...document, geom: document.geometry?.geom })),
    track,
    defaults,
    outing,
    { minFit }
  );

  const located = [];
  for (const [i, document] of documents.entries()) {
    const location = locations[i];
    if (!location || !isEditable(document, 'image', user, true)) {
      continue;
    }
    document.geometry = { ...document.geometry, geom: location.geom };
    document.elevation ??= location.elevation;
    await service.save(document as { document_id: number }, comment);
    const image = associated.find((image) => image.document_id === document.document_id);
    if (image) {
      image.geometry = { ...image.geometry, geom: location.geom };
    }
    located.push(document);
  }
  return located;
}
