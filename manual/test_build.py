"""Check manual URLs and navigation against pages rendered by MkDocs."""

from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest

from mkdocs.commands.build import build
from mkdocs.config import load_config

from markdown import markdown

from build import ManualThemePlugin, ROOT, annotate_examples, page_url


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

    def test_example_metadata_survives_snippets_and_syntax_tabs(self):
        with tempfile.TemporaryDirectory() as tmp:
            examples = Path(tmp) / "examples"
            examples.mkdir()
            for filename in ("modern.csd", "classic.csd"):
                (examples / filename).write_text("instr 1\nendin\n", encoding="utf-8")
            source = '\n'.join(
                f'=== "{name}"\n\n    ``` csound-csd title="Example" linenums="7"\n'
                f'    --8<-- "examples/{name}.csd"\n    ```\n'
                for name in ("modern", "classic")
            )
            rendered = markdown(annotate_examples(source), extensions=[
                "attr_list", "pymdownx.superfences", "pymdownx.tabbed",
                "pymdownx.highlight", "pymdownx.snippets",
            ], extension_configs={
                "pymdownx.highlight": {"pygments_lang_class": True, "linenums_style": "inline"},
                "pymdownx.snippets": {"base_path": [tmp], "check_paths": True},
            })
            elements = NavigationMarkup(rendered).elements
            blocks = [attrs for tag, attrs in elements if "data-example" in attrs]
            self.assertEqual([block["data-example"] for block in blocks], ["modern.csd", "classic.csd"])
            self.assertTrue(all("language-csound-csd" in block["class"] for block in blocks))
            self.assertEqual(rendered.count('class="filename">Example'), 2)
            self.assertRegex(rendered, r'class="linenos">\s*7')
            self.assertNotIn("--8&lt;--", rendered)

    def test_musical_examples_keep_their_subfolder(self):
        source = '\n'.join(['``` csound-csd', '--8<-- "examples/musical/Reinit_Giordani.csd"', '```'])
        self.assertIn('data-example="musical/Reinit_Giordani.csd"', annotate_examples(source))

    def test_only_full_local_csd_includes_get_an_open_button(self):
        for body in ('a1 oscili 0.5, 440', '--8<-- "examples/../secret.csd"',
                     '--8<-- "examples/sample.wav"', '--8<-- "examples/test.csd"\n; extra code'):
            with self.subTest(body=body):
                source = f"``` csound-orc\n{body}\n```"
                self.assertEqual(annotate_examples(source), source)

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
