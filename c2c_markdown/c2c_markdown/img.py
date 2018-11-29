'''
c2corg img Extension for Python-Markdown
==============================================

Converts tags like
[img=<id>(<options>)(/)?](<caption>)?([/img])?
to advanced HTML img tags.
'''

from markdown.extensions import Extension
from markdown.blockprocessors import BlockProcessor
from markdown.util import etree

import re

# \w\W pattern is a trick for capturing all, including new spaces
IMG_RE = r'(?:^|\n)\[img=(\d+)([a-z_ ]*)(/\]|\]([\w\W]*?)\[/img\])'


class C2CImageExtension(Extension):
    def __init__(self, *args, **kwargs):
        self.config = {
            "api_url": ['', 'Base URL of the API. Defaults to ""']
        }

        super(C2CImageExtension, self).__init__(*args, **kwargs)

    def extendMarkdown(self, md, md_globals):  # noqa
        self.md = md
        md.parser.blockprocessors.add('c2cimgblock',
                                      C2CImageBlock(md.parser,
                                                    self.getConfigs()),
                                      "<paragraph")


class C2CImageBlock(BlockProcessor):
    RE = re.compile(IMG_RE)

    def __init__(self, parser, config):
        super(C2CImageBlock, self).__init__(parser)
        self.config = config

    def test(self, parent, block):
        return bool(self.RE.search(block))

    def run(self, parent, blocks):
        block = blocks.pop(0)
        m = self.RE.search(block)

        before = block[:m.start()]
        self.parser.parseBlocks(parent, [before])

        parent.append(self.build_element(m))

        after = block[m.end():]
        self.parser.parseBlocks(parent, [after])

    def build_element(self, m):  # noqa
        # group(1) is everything before the pattern
        # group(2) is the first group of the pattern
        img_id = m.group(1)
        options = m.group(2).split() if m.group(2) else []
        caption = m.group(4).strip() if m.group(4) else ''

        position = 'inline'
        img_size = 'MI'
        for option in options:
            if option in ['left', 'right', 'center', 'inline']:
                position = option
            elif option == 'big':
                img_size = 'BI'
            elif option == 'small':
                img_size = 'SI'
            elif option == 'orig':
                img_size = ''

        img = etree.Element('img')

        img_url = '%s/images/proxy/%s' % (self.config['api_url'], img_id)

        if img_size:
            img_url += '?size=' + img_size

        img.set('src', img_url)
        img.set('alt', (caption or img_id).replace("\n", " "))
        img.set('c2c:role', 'embedded-image')
        img.set('c2c:document-id', img_id)
        img.set('c2c:size', img_size)

        fig = etree.Element('figure')

        fig.append(img)
        # fig.set('class', 'embedded_' + position + ' ' + img_size)
        fig.set('c2c:position', position)

        if caption:
            img_caption = etree.Element('figcaption')
            img_caption.text = caption
            fig.append(img_caption)

        return fig


def makeExtension(*args, **kwargs):  # noqa
    return C2CImageExtension(*args, **kwargs)
