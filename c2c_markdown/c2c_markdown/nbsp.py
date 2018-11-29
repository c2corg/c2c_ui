from markdown import Extension
from markdown.inlinepatterns import Pattern


class NbspPattern(Pattern):
    HTML_ENTITY = "&nbsp;"

    def handleMatch(self, m):  # noqa
        placeholder = self.markdown.htmlStash.store(self.HTML_ENTITY)

        return m.group(2).replace(" ", placeholder)


class NarrowNbspPattern(NbspPattern):
    HTML_ENTITY = "&#8239;"


class C2CNbspExtension(Extension):
    def extendMarkdown(self, md, md_globals):  # noqa

        """
        patterns like

            123 m
            coucou :

        must have a non-breakable space instead of a space.
        """
        md.inlinePatterns.add('c2c_nbsp',
                              NbspPattern(r'(\d [a-z]|[\w\d] :)', md),
                              '<strong')

        md.inlinePatterns.add('c2c_nnbsp',
                              NarrowNbspPattern(r'([\w\d] [;?!])', md),
                              '<strong')


def makeExtension(*args, **kwargs):  # noqa
    return C2CNbspExtension(*args, **kwargs)
