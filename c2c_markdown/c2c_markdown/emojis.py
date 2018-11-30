"""
Inspired from
https://facelessuser.github.io/pymdown-extensions/extensions/emoji/
"""

from markdown import Extension
from markdown import util as md_util
from markdown.inlinepatterns import Pattern
import copy

from pymdownx import emoji1_db
from .emoji_databases import c2c_activities, c2c_waypoints

emoji1_db.SVG_CDN = 'https://cdn.jsdelivr.net/emojione/assets/svg/'

RE_EMOJI = r'(:[+\-\w]+:)'


class Emoji(object):
    def __init__(self, db_name, code, **kwargs):
        self.db_name = db_name
        self.code = code
        self.name = kwargs.pop("name")
        self.category = kwargs.pop("category")
        self.SVG_CDN = kwargs.pop("SVG_CDN")
        self.unicode = kwargs.pop("unicode", None)
        self.svg_name = kwargs.pop("svg_name", self.unicode)
        self.unicode_alt = kwargs.pop("unicode_alt", self.unicode)
        self.classes = kwargs.pop("classes", "emoji")

        assert self.svg_name, "Please precise a SVG name"

    def get_alt(self, user_code):
        """Get alt form."""

        if self.unicode_alt is None:
            alt = user_code
        else:
            alt = ''.join(
                [chr(int(c, 16)) for c in self.unicode_alt.split('-')])

        return alt

    def to_svg(self, user_code):
        """Return svg element."""
        return md_util.etree.Element("img", {
            "c2c:role": "emoji",
            "c2c:emoji-db": self.db_name,
            "c2c:svg-name": self.svg_name,
            "alt": self.get_alt(user_code),
            "title": user_code,
        })


class EmojiPattern(Pattern):
    def __init__(self, pattern, md):

        self.emoji_index = {}

        self._append_to_index(emoji1_db)
        self._append_to_index(c2c_waypoints)
        self._append_to_index(c2c_activities)

        self.markdown = md
        Pattern.__init__(self, pattern)

    def _append_to_index(self, db):

        for code in db.emoji:
            kwargs = db.emoji[code]
            kwargs["SVG_CDN"] = kwargs.get("SVG_CDN", db.SVG_CDN)

            self.emoji_index[code] = Emoji(db_name=db.name, code=code, **kwargs)

        for code in db.aliases:
            self.emoji_index[code] = self.emoji_index[db.aliases[code]]

    def handleMatch(self, m):  # noqa
        user_code = m.group(2)
        emoji = self.emoji_index.get(user_code, None)
        return emoji.to_svg(user_code) if emoji else user_code


class C2CEmojiExtension(Extension):
    def extendMarkdown(self, md, md_globals):  # noqa

        # Add chars to the escape list. Don't just append as it modifies the
        # global list permanently. Make a copy and extend **that** copy so
        # that only this Markdown instance gets modified.
        escaped = copy.copy(md.ESCAPED_CHARS)
        for ec in [':']:
            if ec not in escaped:
                escaped.append(ec)
        md.ESCAPED_CHARS = escaped

        emj = EmojiPattern(RE_EMOJI, md)
        md.inlinePatterns.add("emoji", emj, "<not_strong")


def makeExtension(*args, **kwargs):  # noqa
    return C2CEmojiExtension(*args, **kwargs)
