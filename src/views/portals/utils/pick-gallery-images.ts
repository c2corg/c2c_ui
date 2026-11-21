/** Picks the home gallery images, so that one upload does not fill the whole gallery. */
// The image listing does not give the parent document of an image. But one upload (POST /images/list) creates all its
// images in one go, with consecutive ids: a run of consecutive ids stands for one upload, so mostly for one document.
// Each upload first gets at most `maxPerUpload` images; when that leaves the gallery short, the cap goes up one image
// at a time, so the gallery is as full as before. The picked images keep the order of the listing (newest first).
export function pickGalleryImages<T extends { document_id: number }>(
  images: T[],
  count: number,
  maxPerUpload = 2
): T[] {
  const uploads: number[] = [];
  images.forEach((image, index) => {
    const previous = images[index - 1];
    const sameUpload = previous && Math.abs(previous.document_id - image.document_id) === 1;
    uploads.push(sameUpload ? uploads[index - 1] : index);
  });

  const picked = new Set<number>();
  const pickedPerUpload = new Map<number, number>();
  const target = Math.min(count, images.length);

  for (let cap = maxPerUpload; picked.size < target; cap++) {
    for (let index = 0; index < images.length && picked.size < target; index++) {
      const upload = uploads[index];
      const pickedInUpload = pickedPerUpload.get(upload) ?? 0;
      if (!picked.has(index) && pickedInUpload < cap) {
        picked.add(index);
        pickedPerUpload.set(upload, pickedInUpload + 1);
      }
    }
  }

  return images.filter((_, index) => picked.has(index));
}
