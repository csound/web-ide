import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';
import { buildParserFile } from '@lezer/generator';

const __dirname = dirname(fileURLToPath(import.meta.url));

const externals = [
  'codemirror',
  '@codemirror/commands',
  '@codemirror/search',
  '@codemirror/language',
  '@codemirror/autocomplete',
  '@codemirror/view',
  '@codemirror/state',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
];

function lezerPlugin(): Plugin {
  return {
    name: 'lezer-grammar',
    transform(_code, id) {
      if (!id.endsWith('.grammar')) return null;

      const base = basename(id, '.grammar');
      const grammarCode = readFileSync(id, 'utf8');
      const commonCode =
        base !== 'csd'
          ? readFileSync(resolve(__dirname, 'src/csd.grammar'), 'utf8').replace(
              /@top.*/,
              ''
            )
          : '';

      const { parser } = buildParserFile(`${grammarCode}\n${commonCode}`, {
        fileName: `${base}.grammar`,
        moduleStyle: 'es',
        warn: (msg) => {
          if (base === 'csd') console.error(msg);
        },
      });

      return { code: parser, map: null };
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [lezerPlugin()],
  ...(command === 'build'
    ? {
        build: {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            fileName: 'index',
            formats: ['es'],
          },
          rollupOptions: {
            external: externals,
          },
        },
      }
    : {
        root: resolve(__dirname, 'dev'),
      }),
}));
