# lil2-micromark

[micromark](https://github.com/micromark/micromark) 4.0.2 rewritten in typed [LilScript](https://lilscript.eddocu.com):
the same CommonMark parser and the same HTML, built on flat typed data.

This is the bottom layer of the **lil2** family, a typed rewrite of the react-markdown stack. The family keeps
upstream's behaviour exactly and changes the API so the compiler can flatten everything. The design is in
[`lilscript/docs/lil2/design.md`](https://github.com/yeargun/lilscript/blob/main/docs/lil2/design.md).

## What is different

| upstream micromark | lil2-micromark |
|---|---|
| a point object per position (`{line, column, offset, _index, _bufferIndex}`) | four ints on the tokenizer, copied into token arrays |
| a token object per token | an `int`; fields in parallel `int[]` arrays |
| an event is `['enter', token, context]` | an event is one `int` (`token * 2 + kind`) |
| token types are strings | token types are ints; extensions register theirs |
| chunks of strings and codes | one `int[]` of codes per tokenizer |
| options objects | `micromark(value, allowDangerousHtml, allowDangerousProtocol)` |
| `stream()`, chunked `write()`, `encoding` | not provided (whole-document API) |

The constructs, attempts, backtracking and resolvers are upstream's algorithm, state for state. Only the data
structures changed.

## Use

```js
import {micromark} from '@itslil/lil2-micromark'

micromark('## Hello, *world*!', false, false)
// '<h2>Hello, <em>world</em>!</h2>'
```

## Measured (2026-10-04)

Same surface on both sides: `micromark(value)`. Upstream is micromark 4.0.2 bundled with esbuild and minified
by Terser, esbuild and Oxc (best shown). lil2 is the one shipped Brotli-objective build.

| | lil2-micromark | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 66,613 | 81,652 (Terser) | −18.4% |
| gzip (9) | 25,619 | 26,600 (Terser) | −3.7% |
| Brotli (11) | 21,466 | 22,937 (Terser) | −6.4% |

Speed: identical HTML is a precondition, then median time per `micromark()` call in a fresh browser context
per lane (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763):

| document | Chromium upstream → lil2 | Firefox upstream → lil2 |
|---|---:|---:|
| chat (1 KB) | 0.60 → 0.30 ms (0.50×) | 1.11 → 0.60 ms (0.54×) |
| readme (26 KB) | 14.9 → 7.0 ms (0.47×) | 30.5 → 13.3 ms (0.43×) |
| CommonMark spec (17 KB) | 32.2 → 11.8 ms (0.37×) | 60.5 → 23.0 ms (0.38×) |
| large (227 KB) | 151 → 81 ms (0.53×) | 285 → 130 ms (0.46×) |
| load (import) | 4.7 → 6.0 ms | 9.0 → 11.0 ms |
| first render, cold | 9.5 → 8.6 ms | 13.0 → 9.0 ms |

Loading is slower by the one-time decoding of the 2,125-entry entity table, which ships front-coded.

## Behaviour

`test/differential.test.mjs` compares the HTML with upstream micromark on every CommonMark 0.31 spec example,
every named character reference, edge cases (CR/CRLF, NUL, BOM, tabs, containers, HTML kinds, references)
and the benchmark documents, in safe and dangerous modes. `test/events.test.mjs` compares the whole event stream
with upstream's parser, including every token's type, order and start/end line, column and offset.

```sh
npm install
npm run build:dev   # fast, unsearched build into .dev/
npm run build       # production build into dist/
npm test
```

## License

MIT. micromark is © Titus Wormer, MIT; see NOTICE.md.
