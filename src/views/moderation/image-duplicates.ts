import type { DuplicateImage } from '@/js/apis/c2c/schemas';

// the first upload: by creation date, else by id (the ids follow the creation)
function byUpload(a: DuplicateImage, b: DuplicateImage): number {
  if (a.created_at && b.created_at && a.created_at !== b.created_at) {
    return a.created_at < b.created_at ? -1 : 1;
  }
  return a.document_id - b.document_id;
}

/**
 * The image kept by default, the others being merged into it: the first upload when different users uploaded the copies
 * (probably the one of the photographer), else the collaborative one (the user chose that licence for the same photo),
 * else the first upload.
 */
export function defaultKept(images: DuplicateImage[]): number {
  const sorted = [...images].sort(byUpload);
  const uploaders = new Set(images.map((image) => image.author?.user_id));
  if (uploaders.size === 1) {
    const collaborative = sorted.find((image) => image.image_type === 'collaborative');
    if (collaborative) {
      return collaborative.document_id;
    }
  }
  return sorted[0]!.document_id;
}

export function sameUploader(images: DuplicateImage[]): boolean {
  const uploaders = new Set(images.map((image) => image.author?.user_id ?? null));
  return uploaders.size === 1 && !uploaders.has(null);
}

/** The time between the first and the last upload, in minutes; null when a date is unknown. */
export function uploadSpan(images: DuplicateImage[]): number | null {
  const times = images.map((image) => (image.created_at ? Date.parse(image.created_at) : NaN));
  if (times.some((time) => Number.isNaN(time))) {
    return null;
  }
  return Math.round((Math.max(...times) - Math.min(...times)) / 60000);
}

/** A span of minutes as a count and its unit: minutes under 2 hours, hours under 2 days, else days. */
export function spanParts(minutes: number): { count: number; unit: 'minutes' | 'hours' | 'days' } {
  if (minutes < 120) {
    return { count: minutes, unit: 'minutes' };
  }
  if (minutes < 2 * 24 * 60) {
    return { count: Math.round(minutes / 60), unit: 'hours' };
  }
  return { count: Math.round(minutes / (24 * 60)), unit: 'days' };
}

export function fileSize(bytes: number | null): string {
  if (bytes === null) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
