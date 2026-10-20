import { describe, expect, it } from 'vitest';

import { sanitizeHtml, sanitizeRichHtml } from './sanitize-html';

const parse = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

describe.each([
  ['sanitizeHtml', sanitizeHtml],
  ['sanitizeRichHtml', sanitizeRichHtml],
])('%s', (name, sanitize) => {
  it.each([undefined, null, ''])('returns %j unchanged', (value) => {
    expect(sanitize(value)).toBe(value);
  });

  it('removes <script> elements and their content', () => {
    const result = sanitize('<p>hello</p><script>alert(1)</script>');
    expect(result).toBe('<p>hello</p>');
  });

  it('removes inline event handlers', () => {
    const result = sanitize('<img src="a.jpg" onerror="alert(1)"><p onclick="alert(2)">text</p>');
    expect(result).not.toMatch(/onerror|onclick|alert/);
    expect(parse(result).querySelector('img').getAttribute('src')).toBe('a.jpg');
    expect(parse(result).querySelector('p').textContent).toBe('text');
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    '&#106;avascript:alert(1)',
  ])('removes the %j URL from links', (url) => {
    const link = parse(sanitize(`<a href="${url}">link</a>`)).querySelector('a');
    expect(link.textContent).toBe('link');
    expect(link.hasAttribute('href')).toBe(false);
  });

  it('removes plugin elements', () => {
    expect(sanitize('<object data="x.swf"></object><embed src="x.swf"><b>ok</b>')).toBe('<b>ok</b>');
  });

  it('removes id/name values that would clobber DOM properties', () => {
    expect(sanitize('<h2 id="cookie">a</h2><img name="getElementById">')).toBe('<h2>a</h2><img>');
  });

  it('keeps standard formatting markup and safe links', () => {
    const html =
      '<h2 id="intro">Title</h2><p class="c">Some <strong>bold</strong>, <em>italic</em> and ' +
      '<a href="https://www.camptocamp.org/routes/1" title="t">a link</a>.</p>' +
      '<ul><li>one</li></ul><table><tbody><tr><td>cell</td></tr></tbody></table>' +
      '<img src="https://media.camptocamp.org/c2corg-active/1.jpg" alt="img">';
    expect(sanitize(html)).toBe(html);
  });

  it('keeps relative and mailto links', () => {
    const html = '<a href="/routes/1">r</a><a href="mailto:a@b.c">m</a>';
    expect(sanitize(html)).toBe(html);
  });

  it('removes iframes pointing to non-allowed hosts', () => {
    expect(sanitize('<iframe src="https://evil.example.com/"></iframe><p>x</p>')).toBe('<p>x</p>');
  });
});

describe('sanitizeHtml', () => {
  it('removes all iframes, even from allowed video hosts', () => {
    expect(sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toBe('');
  });

  it('removes custom c2c: attributes', () => {
    expect(sanitizeHtml('<div c2c:role="video">x</div>')).toBe('<div>x</div>');
  });

  it('removes svg and mathml content (html profile only)', () => {
    expect(sanitizeHtml('<svg><circle r="1"></circle></svg><math><mi>x</mi></math><p>p</p>')).toBe('<p>p</p>');
  });
});

describe('sanitizeRichHtml', () => {
  it('keeps the custom c2c: attributes produced by the wiki markdown parser', () => {
    const html =
      '<figure c2c:role="embedded-image" c2c:document-id="123" c2c:size="MI" c2c:position="left">' +
      '<img c2c:url-proxy="https://api/images/proxy/123" c2c:document-type="image"></figure>' +
      '<a c2c:role="internal-link" c2c:document-type="route" c2c:document-id="1" c2c:lang="fr" ' +
      'c2c:slug="my-route" c2c:anchor="a">r</a>' +
      '<img c2c:role="emoji" c2c:emoji-db="emojione" c2c:svg-name="1f600">';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('keeps the direct media url of embedded images', () => {
    const html =
      '<img c2c:role="embedded-image" c2c:document-id="123" c2c:size="MI" ' +
      'c2c:url="https://media.camptocamp.org/c2corg-active/1526229189_1504164474MI.jpg" ' +
      'c2c:url-proxy="/images/proxy/123?size=MI">';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('removes c2c: attributes that are not allow-listed', () => {
    expect(sanitizeRichHtml('<div c2c:unknown="x">x</div>')).toBe('<div>x</div>');
  });

  it.each([
    'https://www.youtube.com/embed/abc',
    'https://www.youtube-nocookie.com/embed/abc',
    'https://player.vimeo.com/video/1',
    'https://www.dailymotion.com/embed/video/x1',
  ])('keeps iframes to %s and forces the sandbox attribute', (src) => {
    const iframe = parse(sanitizeRichHtml(`<iframe src="${src}" frameborder="0" allowfullscreen></iframe>`)).firstChild;
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('src')).toBe(src);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-presentation');
    expect(iframe.hasAttribute('frameborder')).toBe(true);
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
  });

  it('overrides a permissive sandbox attribute set in the markup', () => {
    const iframe = parse(
      sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/abc" sandbox="allow-top-navigation allow-popups">')
    ).firstChild;
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-presentation');
  });

  it('keeps allowed iframes inside the video wrapper', () => {
    const fragment = parse(
      sanitizeRichHtml('<div c2c:role="video"><iframe src="https://player.vimeo.com/video/1"></iframe></div>')
    );
    expect(fragment.querySelector('div').getAttribute('c2c:role')).toBe('video');
    expect(fragment.querySelector('iframe').getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-presentation'
    );
  });

  it.each([
    ['without src', '<iframe></iframe>'],
    ['with a look-alike host', '<iframe src="https://www.youtube.com.evil.example/embed"></iframe>'],
    ['with the allowed host in the path', '<iframe src="https://evil.example/www.youtube.com/"></iframe>'],
    ['with the allowed host as user info', '<iframe src="https://www.youtube.com@evil.example/"></iframe>'],
    ['with a relative src', '<iframe src="/embed/abc"></iframe>'],
    ['with a data: src', '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'],
    ['with a srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
  ])('removes iframes %s', (name, html) => {
    expect(sanitizeRichHtml(`${html}<p>x</p>`)).toBe('<p>x</p>');
  });

  it('never keeps a javascript: src, even with an allowed host', () => {
    const result = sanitizeRichHtml('<iframe src="javascript://www.youtube.com/%0aalert(1)"></iframe>');
    expect(result).not.toMatch(/javascript:/i);
  });

  it('does not let iframes leak into plain sanitizeHtml calls made afterwards', () => {
    sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
    expect(sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toBe('');
  });
});
