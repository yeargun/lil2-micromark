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

## In a chat app

This package is a layer of [lil2-react-markdown](https://github.com/yeargun/lil2-react-markdown), measured here as a whole: A chat of LLM-style replies (lists, code, tables, math, about 2.5 KB of markdown each), every reply streamed into the
page a few tokens at a time and rendered by React with GFM, math and KaTeX: react-markdown 10.1.0 with remark-gfm,
remark-math and rehype-katex → **this package's `/full` flavor**. Main-thread time, measured with Playwright in
Chromium 151, with Chrome's CPU throttling standing in for phones (4×: Lighthouse's mid-tier mobile; 6×: DevTools'
low-end mobile); median of 2 runs, libraries alternating, each in a fresh tab.

| | short chat (5 replies) | average chat (20 replies) | long chat (60 replies) |
|---|---:|---:|---:|
| CPU while the replies stream, mid-tier phone (4×) | 7.1 s → **3.2 s** (2.2×) | 29.1 s → **11.5 s** (2.5×) | 1.3 min → **31.0 s** (2.5×) |
| CPU while the replies stream, low-end phone (6×) | 11.2 s → **4.7 s** (2.4×) | 45.9 s → **17.7 s** (2.6×) | 2.0 min → **47.4 s** (2.5×) |
| CPU while the replies stream, this machine | 1.6 s → **0.8 s** (2.1×) | 6.8 s → **2.7 s** (2.5×) | 17.6 s → **7.0 s** (2.5×) |
| updates slower than a frame (16.7 ms), low-end phone (6×) | 125 → **6 of 1,053** | 671 → **6 of 4,615** | 1,318 → **67 of 12,897** |
| opening the saved chat, low-end phone (6×) | 417 ms → **317 ms** (1.3×) | 843 ms → **519 ms** (1.6×) | 1.77 s → **960 ms** (1.8×) |

Every streamed update renders exactly react-markdown's DOM ([`test/chat.test.mjs`](https://github.com/yeargun/lil2-react-markdown/blob/main/test/chat.test.mjs), Chromium and Firefox).
Reproduce with `npm run bench:chat` in lil2-react-markdown; the numbers are in [`bench/chat/results/mobile.json`](https://github.com/yeargun/lil2-react-markdown/blob/main/bench/chat/results/mobile.json).
The machine is one core of an AMD EPYC 7763; real phones vary.

## Install

```bash
npm install @itslil/lil2-micromark
```

TypeScript types are included. One ES module per entry; Node, Deno, Bun and workers get `dist/`, bundlers targeting
browsers get `dist/browser/` through the `browser` condition.

## Use

```ts
import {micromark} from '@itslil/lil2-micromark'

const html = micromark('## Hello, *world*!')
console.log(html) // <h2>Hello, <em>world</em>!</h2>

// Like upstream, raw HTML and dangerous link protocols are dropped unless you allow them (trusted input only):
const trusted = micromark('<kbd>Ctrl</kbd> [run](javascript:go())', true, true)
console.log(trusted)
```

`micromark(value, allowDangerousHtml?, allowDangerousProtocol?)` is upstream's `micromark(value, {allowDangerousHtml,
allowDangerousProtocol})`; both flags default to `false`. It returns the same HTML as micromark 4 for every input.
Upstream's other options (extensions, `stream`) are not part of this package: for GFM, math or React, see below.

### Which package

| you want | package |
|---|---|
| React elements | [`@itslil/lil2-react-markdown`](https://github.com/yeargun/lil2-react-markdown) (`/gfm`, `/full` for GFM, math, KaTeX) |
| an HTML string, CommonMark | [`@itslil/lil2-micromark`](https://github.com/yeargun/lil2-micromark) |
| an HTML string with GFM, math or KaTeX | `renderToStaticMarkup` of lil2-react-markdown's `/full` flavor (below) |
| mdast (syntax tree) | [`lil2-mdast-util-from-markdown`](https://github.com/yeargun/lil2-mdast-util-from-markdown); with GFM [`lil2-remark-gfm`](https://github.com/yeargun/lil2-remark-gfm), math [`lil2-remark-math`](https://github.com/yeargun/lil2-remark-math), breaks [`lil2-remark-breaks`](https://github.com/yeargun/lil2-remark-breaks) |
| elements from hast columns through any JSX runtime | [`lil2-hast-util-to-jsx-runtime`](https://github.com/yeargun/lil2-hast-util-to-jsx-runtime) |
| hast (HTML tree) | [`lil2-mdast-util-to-hast`](https://github.com/yeargun/lil2-mdast-util-to-hast) and the same three, or [`lil2-rehype-katex`](https://github.com/yeargun/lil2-rehype-katex) with formulas rendered |

Every package is one self-contained ES module with no runtime dependencies (React and KaTeX aside), ships its
TypeScript types, and resolves to a Node build or a browser build through its `exports` conditions.
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
| chat (1 KB) | 0.57 → 0.24 ms (0.43×) | 1.10 → 0.50 ms (0.45×) |
| readme (26 KB) | 14.0 → 6.13 ms (0.44×) | 28.0 → 12.0 ms (0.43×) |
| large (222 KB) | 147 → 60.8 ms (0.41×) | 279 → 115 ms (0.41×) |
| import, cold | 4.30 → 4.70 ms | 8.00 → 9.00 ms |
| first call, cold | 9.40 → 8.90 ms | 12.0 → 9.00 ms |

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
