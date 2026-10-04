# lil2-micromark

[micromark](https://github.com/micromark/micromark) 4.0.2 rewritten in typed [LilScript](https://lilscript.eddocu.com):
the same CommonMark parser and the same HTML, built on flat typed data.

This is the bottom layer of the **lil2** family, a typed rewrite of the react-markdown stack. The family keeps
upstream's behaviour exactly and changes the API so the compiler can flatten everything. The design is in
[`lilscript/docs/lil2/design.md`](https://github.com/yeargun/lilscript/blob/main/docs/lil2/design.md).

## What is different

| upstream micromark | lil2-micromark |
|---|---|
| a point object per position (`{line, column, offset, _index, _bufferIndex}`) | ints on the tokenizer; a token keeps its start and end offset, and line and column come from one line table |
| a token object per token | an `int`; fields in parallel `int[]` arrays |
| an event is `['enter', token, context]` | an event is one `int` (`token * 2 + kind`) |
| token types are strings (`'codeFenced'`, extensions' own) | token types are compile-time ints; each extension package owns a range |
| construct names, `disable: {null: ['codeIndented']}` | construct ids, `disable: [C_CODE_INDENTED]` |
| `parser.defined` (an array of labels) | labels interned to int ids, with what each one defines |
| chunks of strings and codes | one `int[]` of codes per tokenizer; token text is a slice of the source |
| options objects | `micromark(value, allowDangerousHtml, allowDangerousProtocol)` |
| `stream()`, chunked `write()`, `encoding` | not provided (whole-document API) |

The constructs, attempts, backtracking and resolvers are upstream's algorithm, state for state. Only the data
structures changed.

Two builds, as decode-named-character-reference's condition map has them: `dist/` (Node, workers, Deno, …)
carries the 2,125-entry named-reference table; `dist/browser/` (the `browser` condition) decodes named references
with the document's own HTML parser, as upstream's browser graph does, so the table is neither downloaded nor
unpacked at load.

## Use

```js
import {micromark} from '@itslil/lil2-micromark'

micromark('## Hello, *world*!', false, false)
// '<h2>Hello, <em>world</em>!</h2>'
```

## Measured (2026-10-04)

The `browser` build against micromark@4.0.2 bundled for the browser with esbuild and minified by Terser, esbuild and Oxc
(the smallest shown). Each objective is its own LilScript build (effort level 12, `lazy_functions`).

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 46,829 | 53,097 (Terser) | −11.8% |
| gzip (9) | 15,137 | 14,785 (Terser) | +2.4% |
| Brotli (11) | 13,344 | 13,226 (Terser) | +0.9% |

Speed, upstream → lil2: `micromark(value)`, median per call in a fresh browser context per lane, after checking that both
give the same output (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763 64-Core Processor). Cold rows are the first import and the
first call of a fresh page.

| | Chromium | Firefox |
|---|---:|---:|
| chat (1 KB) | 0.62 → 0.27 ms (0.44×) | 1.10 → 0.50 ms (0.45×) |
| readme (26 KB) | 14.8 → 6.37 ms (0.43×) | 30.0 → 12.0 ms (0.40×) |
| large (222 KB) | 158 → 64.5 ms (0.41×) | 284 → 115 ms (0.40×) |
| import, cold | 4.70 → 4.90 ms | 9.00 → 9.00 ms |
| first call, cold | 10.1 → 10.2 ms | 12.0 → 9.00 ms |

## Behaviour

`test/differential.test.mjs` compares the HTML with upstream micromark on every CommonMark 0.31 spec example,
every named character reference, edge cases (CR/CRLF, NUL, BOM, tabs, containers, HTML kinds, references)
and the benchmark documents, in safe and dangerous modes. `test/events.test.mjs` compares the whole event stream
with upstream's parser, including every token's type, order and start/end line, column and offset.
`test/browser.test.mjs` runs the browser build in Chromium and Firefox on the same corpus.

```sh
npm install
npm run build:dev   # fast, unsearched build into .dev/
npm run build       # production build into dist/
npm test
```

## License

MIT. micromark is © Titus Wormer, MIT; see NOTICE.md.
