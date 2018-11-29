# coding: utf-8

"""
LTag Extension for Python-Markdown
====================================

See https://regex101.com/r/bVjbkp/6
"""

from markdown.extensions import Extension
from markdown.blockprocessors import BlockProcessor
from markdown.treeprocessors import Treeprocessor
from markdown.util import etree
import re


def _pairwise(iterable):
    """
    s -> (s0, s1), (s2, s3), (s4, s5), ...
    """
    a = iter(iterable)
    return zip(a, a)


def _get_ltag_pattern():
    """
    Build the big ugly fat regexp for L# numbering. It's based on named
    patterns : (P?<pattern_name>pattern) and decomposed part by part.

    Please have a look on
    https://forum.camptocamp.org/t/question-l/207148/69
    """
    p = "(?P<{}>{})".format

    # small patterns used more than once
    raw_label = r"[a-zA-Z'\"][a-zA-Z'\"\d_]*"

    # let's build multi pitch pattern, like L#1-2 or L#12bis-14
    multi_pitch_label = p("multi_pitch_label", raw_label)
    first_offset = p("first_offset", "\d+")
    last_offset = p("last_offset", "\d+")
    first_pitch = p("first_pitch", first_offset + multi_pitch_label + "?")
    last_pitch = p("last_pitch", last_offset)
    multi_pitch = p("multi_pitch", first_pitch + "-" + last_pitch)

    # mono pitch, like L#, L#12 or L#13bis
    mono_pitch_label = p("mono_pitch_label", raw_label)
    mono_pitch_value = p("mono_pitch_value", "\d*")
    mono_pitch = p("mono_pitch", mono_pitch_value + mono_pitch_label + "?")

    numbering = p("numbering", multi_pitch + "|" + mono_pitch)

    text_in_the_middle = p("text_in_the_middle", "~")
    header = p("header", "=")

    typ = p("type", "[LR]")

    text = "(" + header + "|" + text_in_the_middle + "|" + numbering + ")"

    return p("ltag", typ + "#" + text)


class LTagNumbering(object):
    """
    The aim of this class is to store and handle everything about numbering.
    This class replaces markdown L# values by numeric values, and changes
    it's state if necessary.

    This class owns a one way switch called "supported", initially set to
    True. If it sees an unsupported pattern, it toggles it to False and
    convert any L# pattern to <code>L#Whatever</code>
    """

    # regular expression used to perform the syntax analysis
    PATTERN = re.compile(_get_ltag_pattern())

    # helper for final formatting
    FORMAT = ('<span class="pitch">'
              '<span translate>{type}</span>'
              '{text}</span>').format
    FORMAT_UNMATCHED = '<code>{}</code>'.format

    def __init__(self, markdown):

        self.get_placeholder = markdown.htmlStash.store

        # Values for relative patterns
        self.value = {"R": 0, "L": 0}

        # One way switch
        self.supported = True

        # If no relative pattern is present, then labels are allowed
        # As now, the only relative pattern handled is a simple L#
        self.allow_labels = True

        # if numbering contains a label, then relatives patterns
        # are no more allowed anymore
        self.contains_label = False

    def handle_unmatched(self, match):
        return self.get_placeholder(self.FORMAT_UNMATCHED(match.group(0)))

    def compute(self, markdown, row_type, is_first_cell):
        """
        Replace all L# patterns by good numbering values. it tests that first
        cell perfectly match pattern. If an error occurs or a unsupported
        pattern is found, it will returns raw pattern inside a <code/> block
        """
        if not markdown:
            return markdown

        # test that first cell content perfectly match pattern
        # it's caller roles to check there is only text in this cell
        if is_first_cell and not self.PATTERN.fullmatch(markdown):
            self.supported = False

        if not self.supported:
            return self.PATTERN.sub(self.handle_unmatched, markdown)

        # this function does not belong to self, because it
        # must access to row_type and is_first_cell
        def handle_match(match):

            if match.group("header") is not None:  # means L#=
                result = "" if is_first_cell else match.group(0)

            elif match.group("text_in_the_middle") is not None:
                result = match.group(0)

            elif match.group("multi_pitch") is not None:
                result = self.handle_multipitch(match, is_first_cell)

            elif match.group("mono_pitch") is not None:
                result = self.handle_monopitch(match, row_type, is_first_cell)

            else:
                raise NotImplementedError("Should not happen!?")

            return self.get_placeholder(result)

        try:
            return self.PATTERN.sub(handle_match, markdown)

        except (NotImplementedError, AssertionError):
            self.supported = False
            return self.PATTERN.sub(self.handle_unmatched, markdown)

    def compute_label(self, raw_label):
        """
        Get L# label, and check supported use case
        """

        if raw_label is not None:
            assert self.allow_labels, "Can't handle label"

            self.contains_label = True
        else:
            raw_label = ""

        return raw_label

    def handle_multipitch(self, match, is_first_cell):
        """
        Can be :

            L#1-4
            L#1bis-4
        """
        label = self.compute_label(match.group("multi_pitch_label"))

        typ = match.group("type")
        first_offset = match.group("first_offset")
        last_offset = match.group("last_offset")

        if is_first_cell:  # first cell impacts numbering
            self.value[typ] = int(last_offset)

        text = "".join((first_offset, label, "-", last_offset, label))

        return self.FORMAT(type=typ, text=text)

    def handle_monopitch(self, match, row_type, is_first_cell):
        """
        Can be :

            L#
            L#12
            L#13bis
        """

        label = self.compute_label(match.group("mono_pitch_label"))
        typ = match.group("type")
        value = match.group("mono_pitch_value")

        if value.isdigit():
            # Fixed number : L#12
            # and label :    L#12bis

            if is_first_cell:  # first cell impacts numbering
                self.value[typ] = int(value)

            return self.FORMAT(type=typ, text=value + label)

        elif len(value) == 0:  # Simple use case : L#
            self.allow_labels = False
            assert not self.contains_label, "Not yet supported"

            value = self.value[typ if is_first_cell else row_type]

            if is_first_cell:  # first cell impacts numbering
                value += 1
                self.value[typ] = value

            return self.FORMAT(type=typ, text=str(value))

        else:
            raise NotImplementedError("Should not happen")


class LTagProcessor(BlockProcessor):
    """
    This process will render a L# block into a table.
    It does NOT handle any numbering stuff, as this numbering is global,
    and will be handled by TreeProcessor
    """

    RE_TESTER = re.compile(r"(?:^|\n) {0,3}([LR]#)")
    RE_PIPE_SAVER = re.compile(r'(\|)(?![^|]*\]\])')
    CELL_SEPARATOR = '__--|--__'

    def test(self, parent, block):
        return bool(self.RE_TESTER.search(block))

    def run(self, parent, blocks):

        # Split different L# blocks
        rows = self.RE_TESTER.split(blocks.pop(0))

        before_ltag = rows.pop(0)  # First lines without L# are sent to parser
        if len(before_ltag) != 0:
            self.parser.parseBlocks(parent, [before_ltag])

        # Build XML elements
        table = etree.SubElement(parent, 'table', {'c2c:role': 'ltag', 'class': 'ltag'})
        tbody = etree.SubElement(table, 'tbody')

        col_count = 0
        colspan_rows = []

        # Build as list of LTagRow classes.
        # pairwise is due to result of re.split() function :
        # ["L#", content1, "L#, content2 ...
        for tag, content in _pairwise(rows):
            row = self._build_row(tag + content, tbody, colspan_rows)
            col_count = max(col_count, len(row))

        # Done at the very end, because column count isn't known before
        for row in colspan_rows:
            row[0].set('colspan', str(col_count))

    def _build_row(self, markdown, tbody, colspan_rows):
        """
        This function will split row's markdown into a list of cells,
        and return row object
        """

        row = etree.SubElement(tbody, 'tr', {"tag": markdown[0]})
        marker = markdown[2:3]

        if marker == "~":  # the pattern L#~
            cell = etree.SubElement(row, "td")
            cell.text = markdown[3:].strip(" \n")
            colspan_rows.append(row)

        else:
            cell_node_name = "th" if marker == "=" else "td"  # the pattern L#=

            # replace separator by cell_separator to protect links
            markdown = self.RE_PIPE_SAVER.sub(self.CELL_SEPARATOR, markdown)

            # and split markdown
            for cell_markdown in markdown.split(self.CELL_SEPARATOR):
                cell = etree.SubElement(row, cell_node_name)
                cell.text = cell_markdown.strip(" \n\xa0")

        return row


class LtagTreeprocessor(Treeprocessor):
    """
    The post processor. It search for any L# pattern present in
    table.ltag objects, and replace them with good numbering result
    """

    def run(self, root):

        numbering = LTagNumbering(self.markdown)

        def compute(node, first_cell):
            if node.tag not in ("code", "pre"):
                node.text = numbering.compute(node.text, row_type, first_cell)

                for child in node:
                    compute(child, False)
                    child.tail = numbering.compute(child.tail, row_type, False)

        for row in root.findall("table[@class='ltag']/tbody/tr"):
            is_text_in_the_middle = row[0].get("colspan") is not None

            row_type = row.get("tag")

            for i, cell in enumerate(row):
                is_first_cell = i == 0 and not is_text_in_the_middle

                if is_first_cell and len(cell) != 0:
                    numbering.supported = False

                compute(cell, is_first_cell)

        return root


class C2CLTagExtension(Extension):
    """ Add tables to Markdown. """

    def extendMarkdown(self, md, md_globals):  # noqa
        """ Add an instance of TableProcessor to BlockParser. """
        if '|' not in md.ESCAPED_CHARS:
            md.ESCAPED_CHARS.append('|')

        md.parser.blockprocessors.add('ltag',
                                      LTagProcessor(md.parser),
                                      '<hashheader')
        md.treeprocessors.add('ltag', LtagTreeprocessor(md), '_end')
