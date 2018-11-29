import os
import unittest

from c2c_markdown import parse_code, configure_parsers


def read_file(path):
    with open(path, 'r', encoding="utf-8") as f:
        return f.read()


class TestFormat(unittest.TestCase):
    def setUp(self):  # noqa
        configure_parsers({'api_url': 'https://api.camptocamp.org/'})

    def test_all(self):
        def do_test(test_id, text, expected):
            result = parse_code(text)
            self.assertEqual(expected.rstrip(), result.rstrip(), test_id)

        def process_folder(path):
            for item in os.listdir(path):
                item_path = os.path.join(path, item)

                if os.path.isdir(item_path):
                    process_folder(item_path)
                else:
                    if item_path.endswith(".md"):
                        text = read_file(item_path)
                        expected = read_file(item_path.replace(".md", ".html"))
                        do_test(item_path, text, expected)

        base_path = os.path.dirname(os.path.abspath(__file__))
        process_folder(base_path)
