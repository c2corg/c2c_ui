import DOMPurify from 'dompurify';

/**
 * Central place to sanitize any HTML coming from a source we don't fully control (wiki articles converted from
 * user-authored markdown, Discourse forum posts, third-party geodata services...) before it is ever assigned to
 * `innerHTML` or bound with `v-html`.
 *
 * Two configurations are exposed:
 *
 * - `sanitizeHtml`: safe default for plain "cooked" HTML (forum posts, external service descriptions). Uses DOMPurify's
 *   built-in allow-list (no script, no inline event handlers, no javascript: URIs, etc).
 * - `sanitizeRichHtml`: same protection, but additionally allows the markup produced by the c2c wiki markdown parser,
 *   which:
 *
 *   - Decorates elements with custom `c2c:*` attributes (consumed by src/components/generics/Markdown.vue to enhance
 *       images, emojis, internal links and figures), which are not part of DOMPurify's default attribute allow-list and
 *       would otherwise be stripped;
 *   - Embeds third-party video players (YouTube/Vimeo/Dailymotion) as `<iframe>` elements, a tag DOMPurify removes by
 *       default. `<iframe>` elements themselves keep going through `sandbox`-hardening in Markdown.vue's
 *       computeVideos() after sanitization.
 */

const RICH_CONTENT_ATTR_ALLOWLIST = [
  // custom c2c: attributes produced by the wiki markdown -> html conversion
  'c2c:role',
  'c2c:document-id',
  'c2c:document-type',
  'c2c:url-proxy',
  'c2c:size',
  'c2c:position',
  'c2c:emoji-db',
  'c2c:svg-name',
  'c2c:lang',
  'c2c:slug',
  'c2c:anchor',
  // attributes needed on the allowed <iframe> video embeds
  'allow',
  'allowfullscreen',
  'frameborder',
  'sandbox',
];

const RICH_CONTENT_CONFIG = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: RICH_CONTENT_ATTR_ALLOWLIST,
};

export function sanitizeHtml(html) {
  if (!html) {
    return html;
  }

  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function sanitizeRichHtml(html) {
  if (!html) {
    return html;
  }

  return DOMPurify.sanitize(html, RICH_CONTENT_CONFIG);
}

export default DOMPurify;
