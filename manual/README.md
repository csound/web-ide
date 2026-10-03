# Local Csound manual

The IDE serves a static Csound 7 manual at `/manual/`. It does not load React,
Firebase, a CDN, or web fonts. Search loads its index when used. Only pages with
equations load MathJax. The editor sends its theme and opcode lookups to the
same-origin iframe. The first page lists all opcodes in alphabetical groups;
the upstream introduction lives at `/manual/about/`. Search opens a dialog that
fills the manual view, with an always-visible close button and keyboard access.

Upstream scripts and rendered HTML have the same origin authority as the IDE.
Review upstream changes as application code before updating the source pin.
The iframe tags messages with a document ID and acknowledges each lookup;
requests made during navigation stay queued until the next page is ready.

## Source and licenses

The root `csound-manual/` Git submodule pins a `develop` commit from
[csound/manual](https://github.com/csound/manual). The build copies its tracked
files to a temporary directory and runs the appendix scripts there. The checkout
stays unchanged. Commit or restore tracked source edits before building.

MkDocs and PyMdown render the Markdown; `manual/theme/` supplies the HTML, CSS,
and browser script. The build keeps upstream examples, audio, syntax tabs, code
snippets, links, and copyright notices. Titles use rendered heading text so
Markdown markers do not appear in search results or navigation.

The manual uses GNU FDL 1.3; its appendix generators use GPL 3 or later. Copies
of both licenses live in `manual/licenses/` and ship with the site. MathJax is a
pinned npm dependency. The build copies its SVG TeX bundle, assistive MathML
component, and Apache 2.0 license from `node_modules/mathjax/`. SVG output needs
no font downloads.

`legacy-ids.json` preserves the old IDE manual's entry URLs. Entries present in
Csound 7 redirect locally; removed entries explain the change and link to the
Csound 6 reference. This does not claim that every documented opcode is available
in the browser engine; platform and plugin requirements still apply.

## Development and deployment

Install Python 3.9 or later, then initialize the source and npm dependencies:

```sh
git submodule update --init --recursive
npm ci
npm run manual:prepare
```

The first build creates `manual/.venv/` and installs the pinned Python packages
from `manual/requirements.txt`. Set `PYTHON` to a Python executable path if needed.
CI uses Python 3.12 and initializes the submodule during checkout. Vite builds a
small theme script from the same palette registry and color helpers as the IDE.
The manual reads the shared `theme` preference and follows changes in other tabs;
without a saved choice, it uses the IDE's global default. The editor dock also
accepts theme updates directly from its parent.

`npm start`, `npm run build`, and `npm run build:dev` run `manual:prepare` first.
Preparation reuses `public/manual/` when the source commit, build inputs, and all
output checksums match. Changes trigger a fresh build; only the first build or a
Python requirements update needs pip downloads. All rendered files, build
metadata, and Python tools stay ignored. No source or site archives are committed.

Preparation uses `.manual-prepare.lock/` to prevent overlapping runs and keeps
the old manual until the new copy passes its checks. It restores the old copy if
publication fails. If a process stops without cleanup, remove the lock only after
confirming no preparation is running. A backup left in
`.manual-build-*/previous/` means a filesystem error also blocked restoration;
keep that copy until recovery.

Vite and Firebase serve manual directory indexes separately from the IDE. Manual
files use cache revalidation; the fallback page excludes itself from search
indexing. Use the Firebase hosting emulator to check directory indexes, old
entry URLs, the fallback page, and cache headers.

Run `npm run manual:check` to check local links, fragments, examples, build inputs,
and runtime assets. Run `npm run test:manual` for cache repair, failed builds,
source changes during rendering, and lock checks.

## Updating the manual or its style

Update the submodule to the latest upstream `develop` commit:

```sh
git -C csound-manual fetch origin develop
git -C csound-manual checkout origin/develop
npm run manual:check
```

Review the rendered index, a syntax-tab entry, equations, a long example, and the
manual dock on narrow and wide screens. Check theme changes, search, keyboard
access, and local-only requests. Commit the new `csound-manual` gitlink after
reviewing upstream changes. Theme changes need no submodule update; preparation
rebuilds when files in `manual/` change.
