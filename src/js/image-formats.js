// https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_for_webp
const checkWebpSupport = async () =>
  (
    await Promise.allSettled(
      [
        'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', // lossy
        'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', // lossless
        'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==', // alpha
        // (animation) 'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
      ].map((img) => {
        new Promise((resolve) => {
          const image = new Image();
          image.onload = image.onerror = () => {
            resolve(image.width > 0 && image.height > 0);
          };
          image.src = 'data:image/webp;base64,' + img;
        });
      })
    )
  ).every((result) => result.status === 'fulfilled' && result.value);

const checkAvifSupport = () =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = () => {
      resolve(image.width === 2);
    };
    image.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

let webpSupported;
let avifSupported;

export const isWebpSupported = async () => {
  if (webpSupported === undefined) {
    webpSupported = await checkWebpSupport();
  }
  return webpSupported;
};

export const isAvifSupported = async () => {
  if (avifSupported === undefined) {
    avifSupported = await checkAvifSupport();
  }
  return avifSupported;
};

export const oldFormatTimestamp = Number.Infinity; // TODO fix this once modern image formats are supported
