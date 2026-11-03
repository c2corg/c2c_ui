-- Tests of c2c_head.lua, run from the repository root with a LuaJIT that has cjson, e.g. the one of the image (CI):
--
--   luajit docker/lua/c2c_head_spec.lua
--   docker run --rm -v "$PWD:/src" -w /src -e 'LUA_CPATH=/usr/local/openresty/lualib/?.so;;' c2c_ui:test \
--     /usr/local/openresty/luajit/bin/luajit docker/lua/c2c_head_spec.lua
package.path = 'docker/lua/?.lua;' .. package.path

local cjson = require('cjson.safe')
local head = require('c2c_head')

local failures, count = 0, 0

local function test(name, fn)
  count = count + 1
  local ok, err = pcall(fn)
  if not ok then
    failures = failures + 1
    print('FAIL ' .. name .. '\n  ' .. tostring(err))
  end
end

local function equal(actual, expected)
  if actual ~= expected then
    error('expected ' .. tostring(expected) .. ', got ' .. tostring(actual), 2)
  end
end

local function contains(text, part)
  if not text:find(part, 1, true) then
    error('missing ' .. part .. '\nin ' .. text, 2)
  end
end

local function lacks(text, part)
  if text:find(part, 1, true) then
    error('unexpected ' .. part .. '\nin ' .. text, 2)
  end
end

local function read(path)
  local file = assert(io.open(path, 'rb'))
  local content = file:read('*a')
  file:close()
  return content
end

local urls = { api = 'https://api.example.org', media = 'https://media.example.org/active' }

local function route(locale, extra)
  local doc = {
    document_id = 123,
    type = 'r',
    locales = { locale },
    associations = { images = {} },
  }
  for key, value in pairs(extra or {}) do
    doc[key] = value
  end
  return doc
end

test('parse_path: document views only', function()
  local doc_type, id, lang = head.parse_path('/routes/123/fr/some-title')
  equal(doc_type, 'route')
  equal(id, '123')
  equal(lang, 'fr')

  doc_type, id, lang = head.parse_path('/waypoints/42')
  equal(doc_type, 'waypoint')
  equal(id, '42')
  equal(lang, nil)

  equal(select(3, head.parse_path('/outings/42/')), nil)
  equal(select(3, head.parse_path('/outings/42/xx/title')), nil)
  equal(head.parse_path('/routes'), nil)
  equal(head.parse_path('/routes/print'), nil)
  equal(head.parse_path('/routes/version/123/fr/4'), nil)
  equal(head.parse_path('/routes/edit/123/fr'), nil)
  equal(head.parse_path('/routes/history/123/fr'), nil)
  equal(head.parse_path('/routes/123abc'), nil)
  equal(head.parse_path('/profiles/123'), nil)
  equal(head.parse_path('/unknowns/123'), nil)
  equal(head.parse_path('/'), nil)
end)

test('pick_lang: path, then Accept-Language, then French', function()
  equal(head.pick_lang('it', 'de-DE,de;q=0.9'), 'it')
  equal(head.pick_lang(nil, 'de-DE,de;q=0.9'), 'de')
  equal(head.pick_lang(nil, 'pt-BR, ES;q=0.8'), 'es')
  equal(head.pick_lang(nil, 'en'), 'en')
  equal(head.pick_lang(nil, 'zh_CN'), 'zh')
  equal(head.pick_lang(nil, 'ja'), 'fr')
  equal(head.pick_lang(nil, nil), 'fr')
end)

test('escape', function()
  equal(head.escape([[<a href="x">'&'</a>]]), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
end)

test('strip_markdown: as utils.stripMarkdown', function()
  equal(head.strip_markdown('See [the topo](https://x.org/a) and [[routes/12|that route]]'), 'See the topo and that route')
  equal(head.strip_markdown('- one\n  - two\na - b'), 'one\ntwo\na - b')
  equal(head.strip_markdown('**bold** _it_ # title ~x~ `c` \\'), 'bold it  title x c ')
  equal(head.strip_markdown('m<sup>2</sup> H<sub>2</sub>O'), 'm2 H2O')
end)

test('utf8_prefix: characters, not bytes', function()
  equal(head.utf8_prefix('éèà', 2), 'éè')
  equal(head.utf8_prefix('abc', 5), 'abc')
  equal(head.utf8_prefix('', 5), '')
end)

test('image_url: as getImageUrl', function()
  equal(head.image_url({ document_id = 1, filename = '123_456.jpg' }, 'BI', urls), urls.media .. '/123_456BI.jpg')
  equal(head.image_url({ document_id = 1, filename = '123_456.svg' }, 'BI', urls), urls.media .. '/123_456BI.jpg')
  equal(head.image_url({ document_id = 1, filename = '123_456.jpg' }, nil, urls), urls.media .. '/123_456.jpg')
  equal(head.image_url({ document_id = 7, filename = cjson.null }, 'BI', urls), urls.api .. '/images/proxy/7?size=BI')
end)

test('build: route with a title prefix, a summary and an image', function()
  local doc = route({ lang = 'fr', title_prefix = 'Mont Blanc', title = 'voie normale', summary = '**Belle** course' }, {
    associations = { images = { { document_id = 9, filename = '1_2.jpg' } } },
  })
  local title, tags = head.build(doc, 'route', '123', 'fr', urls)
  equal(title, 'Mont Blanc : voie normale - Camptocamp.org')
  contains(tags, '<meta property="og:title" content="Mont Blanc : voie normale" id="meta-og-title" />')
  contains(tags, '<meta property="og:type" content="website" id="meta-og-type" />')
  contains(tags, '<meta property="og:url" content="https://www.camptocamp.org/routes/123" id="meta-og-url" />')
  contains(tags, '<meta property="og:locale" content="fr_FR" id="meta-og-locale" />')
  contains(tags, '<meta property="og:description" content="Belle course" id="meta-og-description" />')
  contains(tags, '<meta name="description" content="Belle course" id="meta-description" />')
  contains(tags, '<meta property="og:image" content="https://media.example.org/active/1_2BI.jpg" id="meta-og-image" />')
  contains(tags, '<meta name="robots" content="index" id="meta-robots" />')
  local json_ld = cjson.decode(tags:match('<script type="application/ld%+json" id="json%-ld">(.-)</script>'))
  equal(json_ld['@type'], 'NewsArticle')
  equal(json_ld.headline, 'Mont Blanc : voie normale')
  equal(json_ld.image[1], 'https://media.example.org/active/1_2BI.jpg')
end)

test('build: description falls back on the description, cut to 200 characters', function()
  local _, tags = head.build(route({ lang = 'en', title = 't', summary = cjson.null, description = ('é'):rep(250) }), 'route', '1', 'en', urls)
  contains(tags, 'content="' .. ('é'):rep(200) .. '" id="meta-og-description"')
  contains(tags, 'content="en_UK"')
end)

test('build: no description nor image when the document has none', function()
  local _, tags = head.build(route({ lang = 'fr', title = 't' }), 'route', '1', 'fr', urls)
  lacks(tags, 'description')
  lacks(tags, 'og:image')
  lacks(tags, '"image"')
end)

test('build: article type, first letter of the title upper case', function()
  local title, tags = head.build(route({ lang = 'fr', title = 'sécurité' }), 'article', '1', 'fr', urls)
  equal(title, 'Sécurité - Camptocamp.org')
  contains(tags, 'content="article" id="meta-og-type"')
end)

test('build: an image shows itself, with its license', function()
  local doc = route({ lang = 'fr', title = 'photo' }, { filename = '5_6.png', image_type = 'personal' })
  local _, tags = head.build(doc, 'image', '5', 'fr', urls)
  contains(tags, '<meta property="og:image" content="https://media.example.org/active/5_6BI.png" id="meta-og-image" />')
  local json_ld = cjson.decode(tags:match('<script type="application/ld%+json" id="json%-ld">(.-)</script>'))
  equal(json_ld['@type'], 'ImageObject')
  equal(json_ld.contentUrl, 'https://media.example.org/active/5_6.png')
  equal(json_ld.license, 'http://creativecommons.org/licenses/by-nc-nd/3.0/fr/')
end)

test('build: the document text is escaped, and cannot close the JSON-LD script', function()
  local _, tags = head.build(route({ lang = 'fr', title = '"><script>alert(1)</script>' }), 'route', '1', 'fr', urls)
  lacks(tags, '<script>alert')
  contains(tags, 'content="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"')
  equal(select(2, tags:gsub('</script>', '')), 1)
end)

test('build: nothing for a redirection, a private document or an unexpected answer', function()
  equal(head.build(route({ lang = 'fr', title = 't' }, { redirects_to = 2 }), 'route', '1', 'fr', urls), nil)
  equal(head.build({ not_authorized = true }, 'route', '1', 'fr', urls), nil)
  equal(head.build({ locales = {} }, 'route', '1', 'fr', urls), nil)
  equal(head.build(nil, 'route', '1', 'fr', urls), nil)
end)

test('build: the API fixture of a cooked route', function()
  local doc = cjson.decode(read('src/js/apis/c2c/fixtures/route-cooked.json'))
  local title, tags = head.build(doc, 'route', tostring(doc.document_id), 'fr', urls)
  equal(title, 'E2E sommet : E2E voie - Camptocamp.org')
  contains(tags, 'id="meta-og-title"')
end)

test('urls: the preconnect links of index.html', function()
  local html = read('index.html')
    :gsub('%%CAMPTOCAMP_API_URL%%', 'https://api.example.org/')
    :gsub('%%CAMPTOCAMP_MEDIA_URL%%', 'https://media.example.org/active')
  local found = head.urls(html)
  equal(found.api, 'https://api.example.org')
  equal(found.media, 'https://media.example.org/active')
  equal(head.urls('<html></html>'), nil)
  equal(head.urls(read('index.html'):gsub('%%CAMPTOCAMP_API_URL%%', 'javascript:x')), nil)
end)

test('inject: title and tags in the head', function()
  local html = read('index.html')
  local injected = head.inject(html, 'A & B - Camptocamp.org', '<meta id="x" />')
  contains(injected, '<title>A &amp; B - Camptocamp.org</title>')
  lacks(injected, '<title>Camptocamp.org</title>')
  contains(injected, '<meta id="x" />')
  local tags_at, head_end = injected:find('<meta id="x" />', 1, true), injected:find('</head>', 1, true)
  equal(tags_at < head_end, true)
  -- the CSP nonce placeholder is still there for the nonce substitution
  contains(injected, '__CSP_NONCE__')
end)

test('inject: a title with Lua pattern characters', function()
  contains(head.inject('<head><title>Camptocamp.org</title></head>', '100% %1', ''), '<title>100% %1</title>')
end)

print(count - failures .. '/' .. count .. ' passed')
os.exit(failures == 0 and 0 or 1)
