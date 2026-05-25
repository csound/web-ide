# codemirror-lang-csound

CodeMirror 6 language support for Csound.

Provides syntax highlighting and autocompletion for `.csd`, `.orc`, and `.sco` files.
Vendored into the `web-ide` monorepo under `plugins/codemirror-lang-csound`.

## Usage

```ts
import { csoundMode } from '@csound/codemirror-lang-csound';
import { EditorView, basicSetup } from 'codemirror';

const editor = new EditorView({
  extensions: [basicSetup, csoundMode({ fileType: 'csd' })],
  parent: document.getElementById('editor')!,
});
```

`fileType` accepts `'csd'`, `'orc'`, or `'sco'`. Additional options:

```ts
csoundMode({
  fileType: 'csd',
  enableCompletion: true,
  enableSynopsis: true,
  enableDefaultTheme: true,
});
```

## Development

From the repository root:

```console
npm install --ignore-scripts
npm run build:codemirror-lang-csound
npm run typecheck
```

## Package layout

- `src/index.ts` — language wiring, completion, synopsis panel
- `src/csd.grammar` — main Lezer grammar (unified CSD + shared orchestra syntax)
- `src/orc.grammar` — orchestra entry grammar
- `src/sco.grammar` — score grammar
- `src/highlighter.ts` — token classification and `styleTags`
- `src/parser-utils.ts` — opcode metadata helpers
- `src/builtin-opcodes.json` — bundled opcode metadata
- `config/webpack.config.cjs` — package build
- `dev/fixtures/` — grammar test fixtures
