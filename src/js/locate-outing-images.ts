/*
 * The images of an outing located on its GPS track (#4259), once uploaded: those without a location of their own sit on
 * the location the outing had when they were added (js/geo/locate-images.ts).
 */
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { isEditable } from '@/js/composables/editable';
import { hasDefaultLocation, locateImages, readTrack } from '@/js/geo/locate-images';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type User = { readonly isModerator: boolean; id: number | null };

type Outing = C2cDocument & { date_start?: string | null; date_end?: string | null };

// the versions of the outing read for its former locations: its first ones and its last ones
const MAX_VERSIONS = 30;

/** Whether the outing has a track with the times of its points, to locate its images on */
export const hasTimedTrack = (outing: Outing) => readTrack(outing.geometry?.geom_detail).length > 1;

// the locations an image without one got, that the outing gives without a request: its own and its routes'
const currentLocations = (outing: Outing) => [
  outing.geometry?.geom,
  ...(outing.associations?.routes ?? []).map((route) => route.geometry?.geom),
];

const knownGeoms = (geoms: (string | null | undefined)[]) => [
  ...new Set(geoms.filter((geom): geom is string => Boolean(geom))),
];

/**
 * The locations an image added to the outing without its own got: the outing's (now and before) and its routes'.
 * Complete unless some of its history could not be read.
 */
export async function defaultLocations(outing: Outing, lang: string): Promise<{ geoms: string[]; complete: boolean }> {
  const geoms = currentLocations(outing);
  let complete = true;
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
          complete = false;
          return undefined;
        }
      })
    );
    geoms.push(...former);
  } catch {
    // the current locations only
    complete = false;
  }
  return { geoms: knownGeoms(geoms), complete };
}

type ImageDocument = C2cDocument & {
  date_time?: string | null;
  camera_name?: string | null;
  elevation?: number | null;
};

/**
 * The images of an outing to locate, read but not saved yet: applyPlan() saves them. Incomplete when some of the
 * history of the outing could not be read: images on a former location of the outing may be missing.
 */
export type Plan = {
  outing: Outing;
  changes: { document: ImageDocument; geom: string; elevation?: number }[];
  complete: boolean;
};

/**
 * The images of the outing the user may edit, with their location on its track (all the reads, no write). The locations
 * of the associated images, given with the outing, spare requests: its history is read only when some image is not on
 * its current locations, and the images only when one is on a default location. minFit: see locateImages().
 */
export async function planOutingImages(outing: Outing, lang: string, user: User, { minFit = 0 } = {}): Promise<Plan> {
  const plan: Plan = { outing, changes: [], complete: true };
  const track = readTrack(outing.geometry?.geom_detail);
  const associated = outing.associations?.images ?? [];
  if (track.length < 2 || !associated.length) {
    return plan;
  }

  const current = knownGeoms(currentLocations(outing));
  const allCurrent = associated.every((image) => hasDefaultLocation(image.geometry?.geom, current));
  let defaults = current;
  if (!allCurrent) {
    ({ geoms: defaults, complete: plan.complete } = await defaultLocations(outing, lang));
  }
  if (!associated.some((image) => hasDefaultLocation(image.geometry?.geom, defaults))) {
    return plan;
  }

  // all the images, also those with a location: they tell the clock shift of their camera and whether it has a GPS
  const service = c2c.image as DocumentService;
  const documents = (await Promise.all(
    associated.map(async (image) => (await service.get(image.document_id!, imageLang(image, lang))).data)
  )) as unknown as ImageDocument[];

  const locations = locateImages(
    documents.map((document) => ({ ...document, geom: document.geometry?.geom })),
    track,
    defaults,
    outing,
    { minFit }
  );
  documents.forEach((document, i) => {
    const location = locations[i];
    if (location && isEditable(document, 'image', user, true)) {
      plan.changes.push({ document, ...location });
    }
  });
  return plan;
}

// in a lang the image has, so that it is saved with that locale
const imageLang = (image: C2cDocument, lang: string) => {
  const langs = image.available_langs ?? [];
  return langs.includes(lang) ? lang : (langs[0] ?? lang);
};

/**
 * Save the images of the plan at their location (also set on the associations of the outing, for its map). An image
 * changed since it was read (its version is refused) is read again and saved once more. Return the images saved.
 */
export async function applyPlan(plan: Plan, comment: string) {
  const service = c2c.image as DocumentService;
  const located: ImageDocument[] = [];
  for (const { document, geom, elevation } of plan.changes) {
    const planned = document.geometry?.geom;
    const save = (image: ImageDocument) => {
      image.geometry = { ...image.geometry, geom };
      image.elevation ??= elevation;
      return service.save(image as { document_id: number }, comment);
    };
    try {
      await save(document);
    } catch {
      const lang = document.locales?.[0]?.lang ?? '';
      const fresh = (await service.get(document.document_id!, lang)).data as unknown as ImageDocument;
      // located by someone else meanwhile: kept
      if (fresh.geometry?.geom !== planned) {
        continue;
      }
      await save(fresh);
    }
    const image = plan.outing.associations?.images?.find((image) => image.document_id === document.document_id);
    if (image) {
      image.geometry = { ...image.geometry, geom };
    }
    located.push(document);
  }
  return located;
}

/** Locate the images of the outing on its track, and save them: the images saved. */
export async function locateOutingImages(
  outing: Outing,
  lang: string,
  user: User,
  comment: string,
  { minFit = 0 } = {}
) {
  return applyPlan(await planOutingImages(outing, lang, user, { minFit }), comment);
}
