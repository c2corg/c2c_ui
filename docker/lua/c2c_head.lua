-- Head tags of the document pages, in the index.html served to everyone.
--
-- Link preview crawlers (Facebook, WhatsApp, Slack, LinkedIn, X...) don't run JavaScript: they only read the first
-- HTML response. On a document page (/routes/123/fr/some-title), the title, Open Graph tags, description and JSON-LD
-- the app sets once mounted (useHead in src/views/document/utils/document-view.ts) are added here from the API
-- response, with the same ids: the app replaces them when it mounts, without duplicates. The canonical link is left to
-- the app: it adds the title of the document to the path first.
--
-- The functions are pure, except M.render (ngx): docker/lua/c2c_head_spec.lua tests them with a plain LuaJIT.
local cjson = require('cjson.safe')

local M = {}

-- a JSON value that is there: cjson decodes null as cjson.null, which is true in a condition
local function present(value)
  return value ~= nil and value ~= cjson.null
end

-- document types with a public view; profiles are left out (personal data, private profiles)
local DOCUMENT_TYPES = {
  area = true,
  article = true,
  book = true,
  image = true,
  outing = true,
  route = true,
  waypoint = true,
  xreport = true,
}

-- languages of the API (common.attributes.langs in src/js/constants/common.json)
local LANGS = { fr = true, en = true, it = true, de = true, es = true, ca = true, eu = true, sl = true, zh = true }

-- og:locale, as getIsoLanguageTerritory in src/stores/language.ts
local ISO_TERRITORIES = {
  fr = 'fr_FR',
  en = 'en_UK',
  ca = 'ca_ES',
  eu = 'eu_ES',
  it = 'it_IT',
  de = 'de_DE',
  es = 'es_ES',
  zh = 'zh_CN',
  sl = 'sl_SI',
}

local SITE_URL = 'https://www.camptocamp.org'
local LICENSE_PAGE = 'https://www.camptocamp.org/articles/106728'
local DESCRIPTION_LENGTH = 200

-- seconds a built head (or the absence of a document) is kept in the shared dict: an edit shows in the link previews
-- within the hour (the app always shows the current tags); every hit saves an API request
M.CACHE_TTL = 3600
M.MISS_TTL = 60

--- The document type, id and language of a document view path, nil for any other path
-- (same path as the router: /<type>s/:id(\d+)/:lang?/:title?)
function M.parse_path(path)
  local plural, id, rest = path:match('^/(%l+)s/(%d+)(.*)$')
  if not plural or not DOCUMENT_TYPES[plural] then
    return nil
  end
  -- at most a language and a title, and a trailing slash: any other path is the app's not-found page
  if not (rest:match('^/?$') or rest:match('^/[^/]+/?$') or rest:match('^/[^/]+/[^/]+/?$')) then
    return nil
  end
  local lang = rest:match('^/([^/]+)')
  return plural, id, LANGS[lang] and lang or nil
end

--- The language of the page: the one of the path, else the first known one of Accept-Language, else French
function M.pick_lang(path_lang, accept_language)
  if path_lang then
    return path_lang
  end
  for tag in (accept_language or ''):gmatch('[^,]+') do
    local primary = tag:match('^%s*(%a%a)[%-_;%s]') or tag:match('^%s*(%a%a)%s*$')
    if primary and LANGS[primary:lower()] then
      return primary:lower()
    end
  end
  return 'fr'
end

local ESCAPES = { ['&'] = '&amp;', ['<'] = '&lt;', ['>'] = '&gt;', ['"'] = '&quot;', ["'"] = '&#39;' }

function M.escape(value)
  return (tostring(value):gsub('[&<>"\']', ESCAPES))
end

--- utils.stripMarkdown of src/js/utils.ts
function M.strip_markdown(value)
  value = value:gsub('%[([^%]]+)%]%([^)]+%)', '%1') -- external links
  value = value:gsub('%[%[[^|]+|([^%]]+)%]%]', '%1') -- internal links
  value = ('\n' .. value):gsub('\n[ \t]*%-[ \t]+', '\n'):sub(2) -- list markers, with their indentation
  value = value:gsub('[%*_\\#~`]', '') -- emphasis and other similar stuff
  value = value:gsub('<su[bp]>([^\n][^\n]-)</su[bp]>', '%1') -- sup
  return value
end

--- The first characters of a UTF-8 string
function M.utf8_prefix(value, length)
  local count, stop = 0, #value
  for position in value:gmatch('()[^\128-\191]') do
    if count == length then
      stop = position - 1
      break
    end
    count = count + 1
  end
  return value:sub(1, stop)
end

--- getImageUrl of src/js/image-urls.ts (size: nil, 'SI', 'MI' or 'BI'; no webp/avif)
function M.image_url(image, size, urls)
  if not present(image.filename) then
    return urls.api .. '/images/proxy/' .. image.document_id .. (size and ('?size=' .. size) or '')
  end
  local filename = image.filename
  if size then
    filename = filename:gsub('%.', size .. '.', 1):gsub('%.svg', '.jpg', 1)
  end
  return urls.media .. '/' .. filename
end

local function text(value)
  return type(value) == 'string' and value ~= '' and value or nil
end

-- getDocumentTitle of src/js/vue-plugins/document-utils.ts, for a document with locales
local function document_title(locale)
  local title = text(locale.title) or ''
  if text(locale.title_prefix) then
    return locale.title_prefix .. ' : ' .. title
  end
  return title
end

-- the image shown in link previews: the image itself, else the first associated one
local function preview_image(doc, doc_type)
  if doc_type == 'image' then
    return doc
  end
  local images = type(doc.associations) == 'table' and doc.associations.images
  return type(images) == 'table' and images[1] or nil
end

local function image_json_ld(doc, urls)
  local license = LICENSE_PAGE
  if doc.image_type == 'collaborative' then
    license = 'http://creativecommons.org/licenses/by-sa/3.0/fr/'
  elseif doc.image_type == 'personal' then
    license = 'http://creativecommons.org/licenses/by-nc-nd/3.0/fr/'
  end
  return {
    ['@context'] = 'https://schema.org',
    ['@type'] = 'ImageObject',
    contentUrl = M.image_url(doc, nil, urls),
    license = license,
    acquireLicensePage = LICENSE_PAGE,
  }
end

local function document_json_ld(headline, image, urls)
  return {
    ['@context'] = 'https://schema.org',
    ['@type'] = 'NewsArticle',
    headline = headline,
    image = image and { M.image_url(image, 'BI', urls) } or nil,
  }
end

local function meta(attribute, name, content, id)
  return '<meta ' .. attribute .. '="' .. name .. '" content="' .. M.escape(content) .. '" id="' .. id .. '" />'
end

--- The page title and head tags of a document (the decoded ?cook= API response), nil when there is nothing to show
-- (urls: api and media base URLs)
function M.build(doc, doc_type, id, lang, urls)
  if type(doc) ~= 'table' or present(doc.redirects_to) or doc.not_authorized == true then
    return nil
  end
  local locale = type(doc.locales) == 'table' and doc.locales[1]
  if type(locale) ~= 'table' then
    return nil
  end

  local title = document_title(locale)
  local tags = {
    meta('name', 'robots', 'index', 'meta-robots'),
    meta('property', 'og:title', title, 'meta-og-title'),
    meta('property', 'og:type', doc_type == 'article' and 'article' or 'website', 'meta-og-type'),
    meta('property', 'og:url', SITE_URL .. '/' .. doc_type .. 's/' .. id, 'meta-og-url'),
    meta('property', 'og:locale', ISO_TERRITORIES[lang], 'meta-og-locale'),
  }

  local summary = text(locale.summary) or text(locale.description)
  if summary then
    local description = M.utf8_prefix(M.strip_markdown(summary), DESCRIPTION_LENGTH)
    tags[#tags + 1] = meta('property', 'og:description', description, 'meta-og-description')
    tags[#tags + 1] = meta('name', 'description', description, 'meta-description')
  end

  local image = preview_image(doc, doc_type)
  if image then
    tags[#tags + 1] = meta('property', 'og:image', M.image_url(image, 'BI', urls), 'meta-og-image')
  end

  local json_ld = doc_type == 'image' and image_json_ld(doc, urls) or document_json_ld(title, image, urls)
  -- '<' escaped too, so that no text of the document can close the <script>
  tags[#tags + 1] = '<script type="application/ld+json" id="json-ld">'
    .. cjson.encode(json_ld):gsub('<', '\\u003c')
    .. '</script>'

  -- the title as HtmlHeader.vue sets it (first letter upper case: ASCII only)
  local page_title = title:gsub('^%l', string.upper) .. ' - Camptocamp.org'
  return page_title, table.concat(tags, '\n    ')
end

--- index.html with the title and tags
function M.inject(html, page_title, tags)
  local start, stop = html:find('<title>Camptocamp.org</title>', 1, true)
  if start then
    html = html:sub(1, start - 1) .. '<title>' .. M.escape(page_title) .. '</title>' .. html:sub(stop + 1)
  end
  local head_end = html:find('</head>', 1, true)
  if not head_end then
    return html
  end
  return html:sub(1, head_end - 1) .. '  ' .. tags .. '\n  ' .. html:sub(head_end)
end

--- The backend URLs of index.html, as the build and docker/runtime-config.sh write them (<link rel="preconnect">)
function M.urls(html)
  local function url(name)
    local value = html:match('<link rel="preconnect" href="([^"]+)" data%-c2c%-url="' .. name .. '"')
    return value and value:match('^https?://') and value:gsub('/$', '') or nil
  end
  local api, media = url('api'), url('media')
  return api and media and { api = api, media = media } or nil
end

-- the title and tags of a document, from the cache or the API (subrequest to /_c2c_head_api, see nginx.conf)
-- (api_url: where to ask the API, which may be an internal address)
local function head_of(doc_type, id, lang, urls, api_url)
  local cache = ngx.shared.c2c_head
  local key = doc_type .. '/' .. id .. '/' .. lang
  local cached = cache:get(key)
  if cached then
    local entry = cjson.decode(cached)
    return entry and entry.title, entry and entry.tags
  end

  local page_title, tags
  local response = ngx.location.capture('/_c2c_head_api', {
    ctx = { url = api_url .. '/' .. doc_type .. 's/' .. id .. '?cook=' .. lang },
  })
  if response.status == 200 then
    page_title, tags = M.build(cjson.decode(response.body), doc_type, id, lang, urls)
  else
    ngx.log(ngx.WARN, 'c2c_head: API answered ', response.status, ' for ', key)
  end

  if page_title then
    cache:set(key, cjson.encode({ title = page_title, tags = tags }), M.CACHE_TTL)
  else
    cache:set(key, '{}', M.MISS_TTL)
  end
  return page_title, tags
end

--- index.html for the current request: with the head of the document on a document page, unchanged otherwise
function M.render(html)
  local path = ngx.var.request_uri:match('^[^?#]*')
  local doc_type, id, path_lang = M.parse_path(path)
  if not doc_type then
    return html
  end
  local urls = M.urls(html)
  if not urls then
    return html
  end

  local lang = M.pick_lang(path_lang, ngx.var.http_accept_language)
  if not path_lang then
    ngx.header['Vary'] = 'Accept-Language'
  end

  -- C2C_HEAD_API_URL (docker/start.sh), else the public API URL of the page
  local internal_api = ngx.var.c2c_head_api
  local api_url = internal_api ~= '' and internal_api or urls.api
  local ok, page_title, tags = pcall(head_of, doc_type, id, lang, urls, api_url)
  if not ok then
    ngx.log(ngx.ERR, 'c2c_head: ', page_title)
    return html
  end
  return page_title and M.inject(html, page_title, tags) or html
end

return M
