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
 *       default.
 *
 * `<iframe>` elements are handled entirely here, not left to callers: the `uponSanitizeElement` hook below drops any
 * iframe whose `src` isn't one of the known video-player hosts (matching the frame-src CSP directive in
 * docker/nginx.conf) and forces the sandbox attribute on the ones that remain, whether or not they sit inside the
 * `div[c2c:role=video]` wrapper the wiki markdown converter normally produces. This is what actually keeps an attacker
 * from smuggling in an unsandboxed iframe to an arbitrary origin via raw HTML that doesn't go through that wrapper;
 * Markdown.vue's computeVideos() still runs afterwards for the allowfullscreen attribute, but the security boundary is
 * here.
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

// Video player hosts the wiki markdown converter is allowed to embed. Keep in sync with the frame-src directive
// in docker/nginx.conf.
const ALLOWED_IFRAME_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.dailymotion.com'];

// Sandbox applied to every surviving iframe, regardless of markup shape - see Markdown.vue's computeVideos() for
// why exactly these tokens: allow-scripts/allow-same-origin are required by the players' own embed code,
// allow-presentation is required for fullscreen playback. Notably missing: allow-top-navigation, allow-popups,
// allow-forms...
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-presentation';

function isAllowedIframeHost(src) {
  try {
    return ALLOWED_IFRAME_HOSTS.includes(new URL(src, window.location.origin).hostname);
  } catch {
    return false;
  }
}

// Registered once, applies to every DOMPurify.sanitize() call (including plain sanitizeHtml(), which never
// allow-lists <iframe> in the first place, so this is a no-op there).
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName !== 'iframe') {
    return;
  }

  if (!isAllowedIframeHost(node.getAttribute('src') || '')) {
    node.remove();
    return;
  }

  node.setAttribute('sandbox', IFRAME_SANDBOX);
});

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
