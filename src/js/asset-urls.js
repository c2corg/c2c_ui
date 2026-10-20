// Build-time lists of the images that are picked at runtime by file name,
// e.g. the background of a map layer button. Every image of these folders is
// emitted by the build, and its public URL is looked up by file name.

const byFileName = (modules) =>
  Object.fromEntries(Object.entries(modules).map(([path, url]) => [path.split('/').pop(), url]));

const folders = {
  boxes: byFileName(import.meta.glob('@/assets/img/boxes/*.svg', { eager: true, import: 'default' })),
  flags: byFileName(import.meta.glob('@/assets/img/flags/*.svg', { eager: true, import: 'default' })),
  layers: byFileName(import.meta.glob('@/assets/img/layers/*.{jpg,png,svg}', { eager: true, import: 'default' })),
  tracking: byFileName(import.meta.glob('@/assets/img/tracking/*.png', { eager: true, import: 'default' })),
  'yeti/layers': byFileName(
    import.meta.glob('@/assets/img/yeti/layers/*.{jpg,png,svg}', { eager: true, import: 'default' })
  ),
  'yeti/legends': byFileName(import.meta.glob('@/assets/img/yeti/legends/*.png', { eager: true, import: 'default' })),
};

/**
 * Returns the public URL of `src/assets/img/<folder>/<fileName>`. Throws if the image does not exist, as a missing
 * module would.
 *
 * @param {string} folder
 * @param {string} fileName
 * @returns {string}
 */
export function assetUrl(folder, fileName) {
  const url = folders[folder]?.[fileName];
  if (url === undefined) {
    throw new Error(`Cannot find image '${folder}/${fileName}'`);
  }
  return url;
}

// Banner images of the itinevert wizard, one is picked randomly
export const itinevertBanners = Object.values(
  import.meta.glob('@/assets/img/itinevert/banner-img/*.{png,jpg,jpeg,webp,svg}', { eager: true, import: 'default' })
);
