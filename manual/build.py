"""Build the pinned Csound source with MkDocs and the IDE's static theme."""

import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser

import yaml
from mkdocs.commands.build import build
from mkdocs.config import load_config
from pymdownx.emoji import to_alt

ROOT = Path(__file__).resolve().parent.parent


def digest(path):
    """Hash exact file bytes for the build manifest."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


class PageData(HTMLParser):
    """Collect article prose for search without code or script content."""

    def __init__(self, content):
        """Parse one rendered page with HTML entities decoded."""
        super().__init__(convert_charrefs=True)
        self.text = []
        self.article = False
        self.skip = 0
        self.feed(content)

    def handle_starttag(self, tag, attributes):
        """Track article boundaries and blocks omitted from search."""
        if tag == "article":
            self.article = True
        if self.article and tag in {"pre", "script", "style"}:
            self.skip += 1

    def handle_endtag(self, tag):
        """Resume prose collection after an omitted block ends."""
        if tag == "article":
            self.article = False
        if self.article and tag in {"pre", "script", "style"}:
            self.skip -= 1

    def handle_data(self, data):
        """Keep visible article text for the search index."""
        if self.article and not self.skip:
            self.text.append(data)


def copy_source(checkout, destination):
    """Copy tracked source files so generators never change the submodule."""
    names = subprocess.check_output(
        ["git", "-C", str(checkout), "ls-files", "-z"]
    ).decode("utf-8")
    for name in names.split("\0"):
        if not name:
            continue
        relative = Path(name)
        original = checkout / relative
        if (
            relative.is_absolute()
            or ".." in relative.parts
            or original.is_symlink()
            or not original.is_file()
        ):
            raise ValueError(f"Expected a regular source file: {name}")
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(original, target)


def main():
    """Render the checked-out source to an ignored build directory."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    checkout = ROOT / "csound-manual"
    metadata = {
        "commit": subprocess.check_output(
            ["git", "-C", str(checkout), "rev-parse", "HEAD"], text=True
        ).strip(),
        "commitDate": subprocess.check_output(
            ["git", "-C", str(checkout), "show", "-s", "--format=%cs", "HEAD"],
            text=True,
        ).strip(),
    }
    with tempfile.TemporaryDirectory(prefix="csound-manual-") as temporary:
        work = Path(temporary)
        source = work / "source"
        copy_source(checkout, source)
        docs = source / "docs"
        for script in ("makeAppendices.py", "make_indexall.py"):
            subprocess.run(
                [sys.executable, str(source / script)],
                cwd=source,
                check=True,
                stdout=subprocess.DEVNULL,
                env={**os.environ, "PYTHONUTF8": "1"},
            )
        upstream = yaml.load(
            (source / "mkdocs.yml").read_text(encoding="utf-8"), Loader=yaml.BaseLoader
        )
        home = docs / "index.md"
        home.write_text(
            home.read_text(encoding="utf-8")
            .replace("# GETTING STARTED", "## Getting started")
            .replace("# CONTRIBUTORS", "## Contributors"),
            encoding="utf-8",
        )
        output = args.output.resolve()
        lookup = {}
        titles = {}
        for file in sorted(docs.rglob("*.md")):
            text = file.read_text(encoding="utf-8")
            relative = file.relative_to(docs).as_posix()
            url = relative[:-3] + "/" if relative != "index.md" else ""
            heading = re.search(r"^#\s+(.+)$", text, re.M)
            title = heading.group(1).strip() if heading else file.stem
            titles[url] = title
            if file.parent.name in {"opcodes", "scoregens"}:
                entry_id = re.search(r"^id:\s*(.+)$", text, re.M)
                for key in [
                    file.stem,
                    title,
                    entry_id.group(1).strip() if entry_id else file.stem,
                ]:
                    lookup.setdefault(key, url)
        config = {
            "site_name": "Csound 7 Manual",
            "docs_dir": str(docs),
            "site_dir": str(output),
            "theme": {
                "name": None,
                "custom_dir": str(ROOT / "manual/theme"),
                "static_templates": ["404.html"],
            },
            "nav": upstream["nav"],
            "plugins": [],
            "markdown_extensions": [
                "toc",
                "tables",
                "md_in_html",
                "attr_list",
                "pymdownx.inlinehilite",
                "pymdownx.superfences",
                {"pymdownx.tabbed": {"alternate_style": True}},
                {
                    "pymdownx.highlight": {
                        "anchor_linenums": True,
                        "line_spans": "__span",
                        "pygments_lang_class": True,
                        "linenums_style": "inline",
                    }
                },
                {"pymdownx.snippets": {"base_path": [str(docs)], "check_paths": True}},
                {"pymdownx.arithmatex": {"generic": True}},
                "pymdownx.emoji",
            ],
            "extra": {
                "source_commit": metadata["commit"],
                "source_date": metadata["commitDate"],
                "asset_version": digest(ROOT / "manual/theme/manual.css")[:10]
                + digest(ROOT / "manual/theme/manual.js")[:10],
            },
        }
        # Keep upstream note/warning symbols as text instead of CDN images.
        config_path = work / "mkdocs.yml"
        config_path.write_text(yaml.safe_dump(config), encoding="utf-8")
        loaded = load_config(str(config_path))
        loaded.mdx_configs["pymdownx.emoji"] = {"emoji_generator": to_alt}
        build(loaded)
        assets = output / "assets"
        assets.mkdir(exist_ok=True)
        for name in ("manual.css", "manual.js"):
            shutil.copy(ROOT / "manual/theme" / name, assets / name)
            (output / name).unlink(missing_ok=True)
        mathjax = ROOT / "node_modules/mathjax"
        for original, name in (
            ("es5/tex-svg-full.js", "tex-svg-full.js"),
            ("es5/a11y/assistive-mml.js", "assistive-mml.js"),
            ("LICENSE", "LICENSE"),
        ):
            target = assets / "mathjax" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(mathjax / original, target)
        for name in ("COPYING.GFDL-1.3", "COPYING.GPL-3"):
            shutil.copy(ROOT / "manual/licenses" / name, output / name)
        for folder in ("stylesheets", "javascripts"):
            shutil.rmtree(output / folder, ignore_errors=True)
        (output / "lookup.json").write_text(
            json.dumps(lookup, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        documents = []
        for url, title in titles.items():
            file = output / url / "index.html"
            markup = re.sub(
                r'<a id="(__codelineno-[^"]+)" name="[^"]+" href="#[^"]+"></a>',
                r'<span id="\1"></span>',
                file.read_text(encoding="utf-8"),
            )
            markup = markup.replace(
                "<pre>", '<pre tabindex="0" aria-label="Code example">'
            )
            file.write_text(markup, encoding="utf-8")
            data = PageData(markup)
            prose = re.sub(r"\s+", " ", " ".join(data.text)).strip()
            description = prose.removeprefix(title).strip()[:180]
            documents.append(
                {"title": title, "url": url, "description": description, "text": prose}
            )
        (output / "search-index.json").write_text(
            json.dumps(documents, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        # Preserve existing /manual/:id bookmarks without starting the IDE.
        legacy_ids = set(
            json.loads((ROOT / "manual/legacy-ids.json").read_text(encoding="utf-8"))
        )
        alias_names = {
            file.name.casefold()
            for file in output.iterdir()
            if file.is_file() or (file / "index.html").exists()
        }
        for key, url in sorted(
            lookup.items(), key=lambda item: (item[0] not in legacy_ids, item[0])
        ):
            if (
                not re.fullmatch(r"[A-Za-z0-9_-]+", key)
                or key.casefold() in alias_names
            ):
                continue
            alias_names.add(key.casefold())
            destination = "/manual/" + url
            directory = output / key
            directory.mkdir(exist_ok=True)
            (directory / "index.html").write_text(
                f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={html.escape(destination)}"><title>Csound manual</title><a href="{html.escape(destination)}">Continue to {html.escape(key)}</a></html>',
                encoding="utf-8",
            )
        # Removed plugin entries keep an honest landing page instead of a 404
        # or an unrelated result from a similarly named opcode.
        for key in sorted(legacy_ids):
            if (
                key in lookup
                or not re.fullmatch(r"[A-Za-z0-9_-]+", key)
                or (output / key / "index.html").exists()
            ):
                continue
            directory = output / key
            directory.mkdir(exist_ok=True)
            (directory / "index.html").write_text(
                f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(key)} · Csound Manual</title><link rel="stylesheet" href="/manual/assets/manual.css"></head><body><main style="max-width:720px;padding:32px 24px;margin:auto"><h1>{html.escape(key)}</h1><p>This entry is not included in the Csound 7 develop manual.</p><p><a href="https://csound.com/docs/manual/{key}.html">Read the Csound 6 entry</a> or <a href="/manual/?q={key}">search the current manual</a>.</p></main></body></html>',
                encoding="utf-8",
            )
        outputs = {
            file.relative_to(output).as_posix(): digest(file)
            for file in sorted(output.rglob("*"))
            if file.is_file()
        }
        (output / ".build.json").write_text(
            json.dumps(
                {
                    "sourceCommit": metadata["commit"],
                    "pages": len(documents),
                    "outputs": outputs,
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print(f"Built {len(documents)} pages from {metadata['commit']}.")


if __name__ == "__main__":
    main()
