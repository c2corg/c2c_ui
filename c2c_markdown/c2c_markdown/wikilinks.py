'''
c2corg wikiLinks Extension for Python-Markdown
==============================================

Converts tags such as [[document_type/document_id|label]]
to <a href="/document_type/document_id">label</a>

Inspired from https://github.com/waylan/Python-Markdown/blob/master
/markdown/extensions/wikilinks.py
'''

from markdown.extensions import Extension
from markdown.inlinepatterns import Pattern
from markdown.util import etree

# document_type/document_id(/lang(/slug))(#anchor)

DOCUMENT_RE = r'(?P<document_type>[a-z]+)/(?P<document_id>\d+)'
LANG_SLUG_RE = r'(/(?P<lang>[a-z]{2})(/(?P<slug>[a-z0-9\-]+))?)?'
ANCHOR_RE = r'(#(?P<anchor>[a-z0-9\-]+))?'
LABEL_RE = r'(?P<label>[^\]]+)'

TARGET_RE = "".join((
    DOCUMENT_RE,
    LANG_SLUG_RE,
    ANCHOR_RE
))

WIKILINK_RE = r'\[\[' + TARGET_RE + r'\|' + LABEL_RE + r'\]\]'


class C2CWikiLinkExtension(Extension):
    def extendMarkdown(self, md, md_globals):  # noqa
        pattern = C2CWikiLinks(WIKILINK_RE)
        # append to end of inline patterns
        md.inlinePatterns.add('c2cwikilink', pattern, "<not_strong")


class C2CWikiLinks(Pattern):
    def handleMatch(self, m):  # noqa

        a = etree.Element('a', {
            "c2c:role": "internal-link",
            "c2c:document-id": m.group("document_id"),
            "c2c:document-type": m.group("document_type"),
        })

        a.text = m.group("label")

        lang = m.group("lang")
        slug = m.group("slug")
        anchor = m.group("anchor")

        if lang:
            a.set("c2c:lang", lang)

        if anchor:
            a.set("c2c:anchor", anchor)

        if slug:
            a.set("c2c:slug", slug)

        return a


def makeExtension(*args, **kwargs):  # noqa
    return C2CWikiLinkExtension(*args, **kwargs)
