# Web IDE plugin reference

These files belong to the Web IDE. They keep the reference for the plugins
that `@csound/plugins` includes, even if the upstream manual removes it.
The build copies them into a temporary manual tree. Do not edit the submodule
to update these pages.

## Sources

`reference.json` records the source commits. The STK, image, and Chua articles
come from the legacy manual's `opcodes/*.xml`; their examples and images come
from `examples/` and `images/`. The linear-algebra guide comes from the Csound 7
manual's `docs/math/linearalgebra.md`. The text uses GNU FDL 1.3, whose full text
is in `../licenses/COPYING.GFDL-1.3`. Keep each article's author credits.

The local text removes separate-install steps and STK sample-path settings.
Examples use the manual's snippet format, which also adds the Open example
button. Links stay inside the local manual where possible.

## Updates

After changing `@csound/plugins` or `@csound/browser` in `package.json` and the
lockfile, run:

```sh
npm ci
npm run plugins:catalog
npm run manual:check
```

Review the catalog diff against the release's opcode changes. Versions and
binary hashes come from the installed packages; do not copy them into this
README. `plugins:check` and `manual:check` fail when the catalog needs a rebuild.
New non-linear-algebra opcodes need a local article with a short first paragraph
and a Syntax section in a `text` fence. The catalog takes editor help from those
articles. Linear-algebra descriptions live in `linear-algebra-help.json`, shared by their
i-rate and k-rate forms. Each opcode gets a page from its exported signature
and a link to the retained guide. The old guide contains incomplete syntax, so
the rendered guide links to those pages in place of its old syntax tables.

To refresh retained prose, compare the source commits in `reference.json` with
the chosen upstream revision, adapt the changed articles and assets here, and
update only the matching source revision. Keep browser-specific notes and
author credits. Review search, a plugin synopsis in the editor, a page from
each plugin family, and an example before committing.
