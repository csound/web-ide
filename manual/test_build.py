"""Check manual URLs and navigation against pages rendered by MkDocs."""

from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest

from mkdocs.commands.build import build
from mkdocs.config import load_config

from build import ManualThemePlugin, ROOT, page_url


class NavigationMarkup(HTMLParser):
    """Collect rendered elements without a browser's error recovery."""

    def __init__(self, markup):
        super().__init__()
        self.elements = []
        self.feed(markup)

    def handle_starttag(self, tag, attributes):
        self.elements.append((tag, dict(attributes)))


class ManualBuildTests(unittest.TestCase):
    """Exercise the directory-index rules and active chapter markup."""

    def test_directory_indexes_and_active_navigation(self):
        for root_index in ("index.md", "README.md"):
            with self.subTest(root_index=root_index), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                docs = root / "docs"
                output = root / "site"
                pages = {
                    root_index: "",
                    "chapters/index.md": "chapters/",
                    "chapters/guide/README.md": "chapters/guide/",
                    "opcodes/index.md": "opcodes/",
                    "opcodes/oscili.md": "opcodes/oscili/",
                    "scoregens/README.md": "scoregens/",
                    "scoregens/gen01.md": "scoregens/gen01/",
                    "intro/readme.md": "intro/readme/",
                }
                for source in pages:
                    file = docs / source
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_text(f"# {source}\n", encoding="utf-8")
                config_file = root / "mkdocs.yml"
                config_file.write_text("site_name: Manual test\n", encoding="utf-8")
                config = load_config(
                    str(config_file),
                    docs_dir=str(docs),
                    site_dir=str(output),
                    theme={"name": None, "custom_dir": str(ROOT / "manual/theme")},
                    plugins=[],
                    nav=[
                        {"Home": root_index},
                        {"Chapters": [
                            {"Overview": "chapters/index.md"},
                            {"Guide": "chapters/guide/README.md"},
                        ]},
                    ],
                )
                config.plugins["manual-theme"] = ManualThemePlugin([])
                build(config)
                for source, expected in pages.items():
                    with self.subTest(source=source):
                        self.assertEqual(page_url(source), expected)
                        rendered = output / page_url(source) / "index.html"
                        self.assertIn(source, rendered.read_text(encoding="utf-8"))
                chapter = (output / "chapters/index.html").read_text(encoding="utf-8")
                elements = NavigationMarkup(chapter).elements
                self.assertNotIn("detailsopen", [tag for tag, _ in elements])
                self.assertTrue(any(
                    tag == "details" and "open" in attrs for tag, attrs in elements
                ))
                self.assertEqual(sum(
                    tag == "a" and attrs.get("aria-current") == "page"
                    for tag, attrs in elements
                ), 1)
                self.assertNotIn('"aria-current=', chapter)


if __name__ == "__main__":
    unittest.main()
