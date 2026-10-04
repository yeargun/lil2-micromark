// Same events as upstream micromark's parser: types, order and every start/end position.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {parse, postprocess, preprocess} from 'micromark'
import {corpus} from './corpus.mjs'
const artifact = process.env.LIL2_EVENTS ?? '../.dev/events/events.js'
const {eventsText} = await import(new URL(artifact, import.meta.url))

function upstream(value) {
  const events = postprocess(parse().document().write(preprocess()(value, undefined, true)))
  return events.map(([kind, t]) => `${kind} ${t.type} ${t.start.line}:${t.start.column}:${t.start.offset}-${t.end.line}:${t.end.column}:${t.end.offset}`).join('\n')
}

test('event streams equal upstream', () => {
  const failures = []
  for (const c of corpus()) {
    const expected = upstream(c.markdown)
    const actual = eventsText(c.markdown)
    if (actual !== expected) {
      const a = actual.split('\n'), e = expected.split('\n')
      let i = 0
      while (i < a.length && a[i] === e[i]) i++
      failures.push({name: c.name, markdown: c.markdown.slice(0, 120), at: i, expected: e.slice(i, i + 3), actual: a.slice(i, i + 3)})
    }
  }
  if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 6)}, null, 1))
  assert.equal(failures.length, 0)
})
