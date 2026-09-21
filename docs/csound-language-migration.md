# Csound language migration

This branch replaces `@hlolli/codemirror-lang-csound` with the core interface
of `@kunstmusik/codemirror-lang-csound`.

## Ownership

- `src/components/editor/csound-language.ts` composes `csound({ mode })`
  with the IDE's extensions. It disables upstream's semantic colors and hover
  UI, keeps completion, and sets the IDE's two-space indent.
- `csound-highlighting.ts` supplies the IDE's rate classes, using upstream's
  semantic results to distinguish opcode calls from variables.
  Its identifier group comes from upstream's `/syntax` entry. Checked names
  and sets also cover the synopsis and context adapters, so a renamed node
  fails typechecking instead of silently losing behavior.
- `csound-synopsis.ts` renders the bottom panel from `getCsoundHoverInfo`.
  The IDE owns the DOM, layout, and stale-result handling.
- `src/styles/code-mirror-painter.tsx` chooses all colors and panel styles.
- `utils.ts` owns context selection and execution. Its context helper adapts
  the current grammar to plain `{ from, to, kind }` ranges. Block evaluation
  sends score statements, including those inside CSDs, to `readScore`.

The IDE does not use `/compat`. That temporary package entry only translates
old language-option names for other hosts. Neither it nor the core package
owns the IDE's themes, synopsis, keybindings, or evaluation policy.

## Release gate

The companion [language PR](https://github.com/kunstmusik/codemirror-lang-csound/pull/1)
prepares version 1.0.3. That version is not yet on npm, so do not merge or deploy
this IDE branch until it ships. Do not republish changed contents as 1.0.2.

The manifest and lockfile require 1.0.3. The lock entry deliberately has no
registry URL or integrity hash yet: a local preview hash must not stand in for
the future npm release. Before merging, refresh the real registry metadata:

```sh
npm install --package-lock-only --ignore-scripts @kunstmusik/codemirror-lang-csound@^1.0.3
npm ci
npm run test:ci
npm run typecheck
npm run lint
npm run build
```

Commit that lockfile update after the upstream release. Until then, a normal
registry install is expected to fail because 1.0.3 does not exist yet.

## Testing a local preview

Build and pack the language package from its worktree:

```sh
npm run build --workspace packages/codemirror-lang-csound
npm pack --workspace packages/codemirror-lang-csound --pack-destination /tmp
```

Then, from this IDE worktree, install the archive without changing its manifest
or lockfile:

```sh
npm install --no-save --ignore-scripts /tmp/kunstmusik-codemirror-lang-csound-1.0.3.tgz
npm run test:ci
npm run typecheck
npm run lint
npm run build
```

The editor tests use the actual IDE composition and evaluation functions. They
cover modes, theme classes, whole-token `0dbfs`, synopsis updates, instrument
and UDO selection, top-level statements, score execution, explicit selections,
and stopped-engine behavior. Package tests cover language behavior separately.
