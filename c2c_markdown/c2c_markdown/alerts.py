from markdown.extensions import Extension
from markdown.blockprocessors import BlockProcessor
from markdown import util
import re


class AlertProcessor(BlockProcessor):
    RE = re.compile(r'(^|\n)[ ]{0,3}(!{2,4})(([^!]|$).*)')

    roles = {
        "!!": "info",
        "!!!": "warning",
        "!!!!": "danger",
    }

    def test(self, parent, block):
        return bool(self.RE.search(block))

    def run(self, parent, blocks):
        block = blocks.pop(0)
        m = self.RE.search(block)
        level = m.group(2)
        tester = re.compile("^[ ]{0,3}" + level + "([^!]|$)")

        before = block[:m.start()]  # Lines before blockquote
        # Pass lines before alert banner
        self.parser.parseBlocks(parent, [before])

        after = block[m.start():].split('\n')
        if len(after[0]) == 0:
            after.pop(0)

        block = []

        # get all lines starting with the same prefix
        while len(after):
            is_same_level = bool(tester.search(after[0]))
            if is_same_level:
                block.append(after.pop(0))
            else:
                break

        # Remove `!!!` from begining of each line.
        block = '\n'.join([self.clean(line) for line in block])

        quote = util.etree.SubElement(parent, 'div')
        quote.set("c2c:role", self.roles[level])
        # Recursively parse block with div as parent.
        self.parser.parseChunk(quote, block)

        # and continue parsing next part of the block
        self.parser.parseBlocks(parent, ["\n".join(after)])

    def clean(self, line):
        """ Remove ``!`` from beginning of a line. """
        m = self.RE.match(line)
        if line.strip() in ("!!", "!!!", "!!!!"):
            return ""
        elif m:
            return m.group(3)
        else:
            return line


class AlertExtension(Extension):
    def extendMarkdown(self, md, md_globals):  # noqa
        md.parser.blockprocessors.add('c2calert',
                                      AlertProcessor(md.parser),
                                      "<paragraph")


def makeExtension(*args, **kwargs):  # noqa
    return AlertExtension(*args, **kwargs)
