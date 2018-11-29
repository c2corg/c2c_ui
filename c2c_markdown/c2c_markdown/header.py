import markdown
from markdown.blockprocessors import BlockProcessor
from markdown import util
import re
import logging

logger = logging.getLogger('MARKDOWN')


# copied from class markdown.blockprocessors.HashHeaderProcessor
class C2CHeaderProcessor(BlockProcessor):
    """ Process Hash Headers. """

    # Detect a header at start of any line in block
    RE = re.compile(r'(^|\n)'
                    r'(?P<level>#{1,6})'
                    r'(?P<header>.*?)'
                    r'(?P<emphasis>#+[^#]*?)?'
                    r'(?P<fixed_id>\{#[\w-]+\})?'
                    r'(\n|$)')

    def test(self, parent, block):
        return bool(self.RE.search(block))

    def run(self, parent, blocks):
        block = blocks.pop(0)
        m = self.RE.search(block)
        if m:
            before = block[:m.start()]  # All lines before header
            after = block[m.end():]  # All lines after header
            if before:
                # As the header was not the first line of the block and the
                # lines before the header must be parsed first,
                # recursively parse this lines as a block.
                self.parser.parseBlocks(parent, [before])
            # Create header using named groups from RE
            h = util.etree.SubElement(parent, 'h%d' % len(m.group('level')))
            h.text = m.group('header').strip()

            if m.group("fixed_id"):
                h.set('id', m.group("fixed_id")[2:-1])

            if m.group('emphasis'):
                emphasis_text = m.group('emphasis').strip("# ")
                if len(emphasis_text) != 0:
                    emphasis = util.etree.SubElement(h, 'span')
                    emphasis.set('c2c:role', 'header-emphasis')
                    emphasis.text = ' ' + emphasis_text

            if after:
                # Insert remaining lines as first block for future parsing.
                blocks.insert(0, after)
        else:  # pragma: no cover
            # This should never happen, but just in case...
            logger.warn("We've got a problem header: %r" % block)


class C2CHeaderExtension(markdown.Extension):
    def extendMarkdown(self, md, md_globals):  # noqa
        md.parser.blockprocessors.add(
            'header_emphasis',
            C2CHeaderProcessor(md.parser),
            "<hashheader")


def makeExtension(configs=[]):  # noqa
    return C2CHeaderExtension(configs=configs)
