"""Build the pinned Csound source with MkDocs and the IDE's static theme."""

import argparse
import hashlib
import html
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from functools import lru_cache

from markdown import markdown
import yaml
from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.plugins import BasePlugin
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


@lru_cache(maxsize=8192)
def plain_title(value):
    """Read heading text without leaking Markdown or HTML into labels."""
    return "".join(PageData("<article>" + markdown(value) + "</article>").text).strip()


def page_url(source):
    """Match MkDocs directory URLs, including index.md and README.md pages."""
    source = PurePosixPath(source)
    destination = (
        source.parent
        if source.name in {"index.md", "README.md"}
        else source.with_suffix("")
    )
    return "" if destination == PurePosixPath(".") else f"{destination}/"


class ManualThemePlugin(BasePlugin):
    """Use the same clean titles in navigation, page titles, and search."""

    def __init__(self, groups):
        """Pair opcode pages in exactly the same order as the index."""
        super().__init__()
        entries = [
            {
                "title": title,
                "url": page_url(f"opcodes/{name}"),
                "source": f"opcodes/{name}",
            }
            for _, items in groups
            for title, name in items
        ]
        self.neighbors = {
            entry["source"]: {
                "previous": entries[index - 1] if index > 0 else None,
                "next": entries[index + 1] if index + 1 < len(entries) else None,
            }
            for index, entry in enumerate(entries)
        }

    def on_env(self, env, **kwargs):
        """Expose heading text to the static page templates."""
        env.filters["plain_title"] = plain_title
        return env

    def on_page_context(self, context, page, **kwargs):
        """Render opcode links without a browser-side index download."""
        context["opcode_neighbors"] = self.neighbors.get(page.file.src_uri)
        return context


def opcode_groups(docs):
    """Sort opcodes once for both the index and entry navigation."""
    groups = {}
    for file in (docs / "opcodes").glob("*.md"):
        heading = re.search(r"^#\s+(.+)$", file.read_text(encoding="utf-8"), re.M)
        title = plain_title(heading.group(1)) if heading else file.stem
        first = title[0].upper()
        group = (
            first
            if "A" <= first <= "Z"
            else "Numbers" if first.isdigit() else "Symbols"
        )
        groups.setdefault(group, []).append((title, file.name))
    order = sorted(
        groups,
        key=lambda key: (key not in {"Symbols", "Numbers"}, key != "Symbols", key),
    )
    return [
        (
            group,
            sorted(groups[group], key=lambda entry: (entry[0].casefold(), entry[0])),
        )
        for group in order
    ]


def opcode_index(groups):
    """List every opcode once, in alphabetical groups that fit narrow views."""
    content = [
        "# Opcode index",
        '<nav class="opcode-jump" aria-label="Opcode initials">',
    ]
    for group, _ in groups:
        content.append(f'<a href="#{group.lower()}">{group}</a>')
    content.append("</nav>")
    for group, entries in groups:
        content.extend([f"\n## {group}\n", '<div class="opcode-list" markdown="1">\n'])
        for title, name in entries:
            content.append(f"- [`{title}`](opcodes/{name})")
        content.append("\n</div>\n")
    return "\n".join(content)


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
        (docs / "about.md").write_text(
            home.read_text(encoding="utf-8")
            .replace("# GETTING STARTED", "## Getting started")
            .replace("# CONTRIBUTORS", "## Contributors"),
            encoding="utf-8",
        )
        groups = opcode_groups(docs)
        home.write_text(opcode_index(groups), encoding="utf-8")
        (docs / "opcodesIndex.md").write_text(
            home.read_text(encoding="utf-8"), encoding="utf-8"
        )
        upstream["nav"][0] = {"Opcode index": "index.md"}
        upstream["nav"].insert(1, {"About this manual": "about.md"})
        theme_assets = work / "theme"
        subprocess.run(
            ["node", str(ROOT / "scripts/build-manual-theme.mjs"), str(theme_assets)],
            cwd=ROOT,
            check=True,
        )
        output = args.output.resolve()
        lookup = {}
        titles = {}
        for file in sorted(docs.rglob("*.md")):
            text = file.read_text(encoding="utf-8")
            relative = file.relative_to(docs).as_posix()
            url = page_url(relative)
            heading = re.search(r"^#\s+(.+)$", text, re.M)
            title = plain_title(heading.group(1)) if heading else file.stem
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
                "theme_version": digest(theme_assets / "manual-theme.js")[:10],
                "asset_version": digest(ROOT / "manual/theme/manual.css")[:10]
                + digest(ROOT / "manual/theme/manual.js")[:10],
            },
        }
        # Keep upstream note/warning symbols as text instead of CDN images.
        config_path = work / "mkdocs.yml"
        config_path.write_text(yaml.safe_dump(config), encoding="utf-8")
        loaded = load_config(str(config_path))
        loaded.mdx_configs["pymdownx.emoji"] = {"emoji_generator": to_alt}
        loaded.plugins["manual-theme"] = ManualThemePlugin(groups)
        build(loaded)
        assets = output / "assets"
        assets.mkdir(exist_ok=True)
        shutil.copy(theme_assets / "manual-theme.js", assets / "manual-theme.js")
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
        # Example assets share one directory and retain their upstream filenames.
        (output / "example-assets.json").write_text(
            json.dumps(sorted(
                file.name for file in (output / "examples").iterdir()
                if file.is_file() and file.suffix.lower() != ".csd"
            ), ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
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
                f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(key)} · Csound Manual</title><link rel="stylesheet" href="/manual/assets/manual.css"><script src="/manual/assets/manual-theme.js"></script></head><body><main style="max-width:720px;padding:32px 24px;margin:auto"><h1>{html.escape(key)}</h1><p>This entry is not included in the Csound 7 develop manual.</p><p><a href="https://csound.com/docs/manual/{key}.html">Read the Csound 6 entry</a> or <a href="/manual/?q={key}">search the current manual</a>.</p></main></body></html>',
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
