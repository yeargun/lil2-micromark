// Shared inputs for the differential suites: CommonMark spec examples, every named entity,
// edge cases micromark's own tests exercise, and the bench documents.
import {readFileSync, existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {characterEntities} from 'character-entities'
const require = createRequire(import.meta.url)
const spec = require('commonmark.json').commonmark

export function corpus() {
  const cases = spec.map(c => ({name: `spec ${c.example} (${c.section})`, markdown: c.markdown}))
  const names = Object.keys(characterEntities)
  for (let i = 0; i < names.length; i += 64) cases.push({name: `entities ${i}`, markdown: names.slice(i, i + 64).map(n => `&${n};`).join(' ')})
  const edge = ['', '\n', '\r\n', '\r', 'a\rb\r\nc\nd', '\0', 'a\0b', '﻿bom', '\t\tcode', ' \t a', '>\tq', '-\tx', '1.\tx',
    '*a **b** c*', '***a***', '_a_b_', '[a]: <b c> "t"\n\n[a]', '[x][]\n\n[x]: /u', '![a](b "c")', '<a href="x">', '<!-- c -->',
    '<?p?>', '<![CDATA[x]]>', '<!X y>', 'a  \nb', 'a\\\nb', '`` ` ``', '&#0; &#x110000; &#xD800; &amp &copy;', '<https://a.b> <a@b.c>',
    '# a #\n## b ##   \n###### c\n####### d', 'a\n===\nb\n---', '- [ ] x\n- [x] y', '1) a\n2) b\n\n3. c', '* a\n\n  b\n* c',
    '```js meta\ncode\n```', '~~~\n```\n~~~', '    x\n\n    y', '<div>\n*a*\n\n*b*', '| a |\n| - |', 'https://a.b', '[a](<b> \'t\')',
    '\\*not\\* \\', '> a\n> > b\n> c', '- a\n  > b\n  ```\n  c\n  ```', 'x' + '*'.repeat(50) + 'y']
  for (const [i, markdown] of edge.entries()) cases.push({name: `edge ${i}`, markdown})
  for (const doc of ['chat', 'readme', 'large', 'gfm', 'math']) {
    const file = `/home/azureuser/lilscript-work/wt/rm-perf/bench/corpus/${doc}.md`
    if (existsSync(file)) cases.push({name: `bench ${doc}`, markdown: readFileSync(file, 'utf8')})
  }
  return cases
}
