"""Add the Web IDE's retained plugin reference to a temporary manual copy."""

import json
from pathlib import Path
import re
import shutil


def add_plugin_docs(root, docs):
    source = root / "manual/plugins"
    catalog = json.loads((root / "src/plugins/catalog.json").read_text())
    provenance = json.loads((source / "reference.json").read_text())
    entries = {entry["name"]: entry for entry in catalog["opcodes"]}
    for folder in ("opcodes", "examples", "images"):
        shutil.copytree(source / folder, docs / folder, dirs_exist_ok=True)
    guides = docs / "plugins"
    guides.mkdir(exist_ok=True)
    index = [
        "# Plugins included in the Web IDE",
        "Chua, image, linear algebra, and STK load automatically for playback, "
        "rendering, embeds, and examples. You do not need to install them or add "
        "`--opcode-lib`. Utility calls do not load these plugins.",
        "These pages belong to the Web IDE's manual. They retain the plugin "
        "reference and credits separately from the upstream Csound 7 manual.",
    ]
    notes = {
        "chua": "Models Chua's circuit. Keep its output within your intended audio range.",
        "image": "Creates, reads, changes, and writes PNG images in Csound's virtual filesystem.",
        "linearAlgebra": "Scalar, vector, and matrix operations. Read the [array and operation guide](../math/linearalgebra.md).",
        "stk": "Physical models and other STK instruments. The plugin contains its raw-wave samples; no sample download or RAWWAVE_PATH setting is needed. An explicit RAWWAVE_PATH uses the files you supply instead.",
    }
    for group, label in catalog["groups"].items():
        index.extend([f"## {label}", notes[group]])
        index.extend(f'- [{entry["name"]}](../opcodes/{entry["name"]}.md)'
                     for entry in entries.values() if entry["plugin"] == group)
    index.extend([
        "## Sources and credits",
        "The retained articles and examples use GNU FDL 1.3. Their author credits "
        "remain on each page. The Web IDE adapted native installation notes and "
        "sample paths for its browser runtime.",
        f'[Original plugin articles]({provenance["repository"]}/tree/{provenance["legacyRevision"]}/opcodes) · '
        f'[Original linear-algebra guide]({provenance["repository"]}/blob/{provenance["linearAlgebraRevision"]}/docs/math/linearalgebra.md)',
    ])
    (guides / "index.md").write_text("\n\n".join(index) + "\n", encoding="utf-8")
    linear = (source / "linear-algebra.md").read_text(encoding="utf-8")
    # The old overview's tables omit overloads and contain obsolete names.
    # Keep its explanations and link to the binary-checked per-opcode syntax.
    def current_links(match):
        names = list(dict.fromkeys(re.findall(r"\bla_[A-Za-z0-9_]+", match[0])))
        return " · ".join(f'[{name}](../opcodes/{name}.md)' for name in names if name in entries)
    linear = re.sub(r"```[^\n]*\n[\s\S]*?```", current_links, linear)
    (docs / "math").mkdir(exist_ok=True)
    (docs / "math/linearalgebra.md").write_text(linear, encoding="utf-8")
    for entry in entries.values():
        if entry["plugin"] != "linearAlgebra":
            continue
        name = entry["name"]
        text = [f"# {name}", entry["description"], "## Syntax"]
        text.extend(f'``` text\n{syntax}\n```' for syntax in entry["syntax"])
        text.extend([
            "`i` arguments run at initialization, `k` arguments at control rate, "
            "`a` arguments at audio rate, and `f` arguments carry spectral data. "
            "Bracketed arguments are optional; the syntax shows their defaults.",
            "Vector and matrix arguments use handles created by the corresponding "
            "creation opcodes. The [linear-algebra guide](../math/linearalgebra.md) "
            "explains allocation, element types, indexing, and operations.",
            "## Credits", "Michael Gogins. Reference text retained under GNU FDL 1.3.",
        ])
        (docs / "opcodes" / f"{name}.md").write_text("\n\n".join(text) + "\n", encoding="utf-8")
    return catalog
