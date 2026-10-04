// Same input, same HTML as upstream micromark, in safe and dangerous modes.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {micromark as upstream} from 'micromark'
import {corpus} from './corpus.mjs'
const artifact = process.env.LIL2_ARTIFACT ?? '../dist/micromark.js'
const {micromark} = await import(new URL(artifact, import.meta.url))

for (const [mode, options] of [['safe', {}], ['dangerous', {allowDangerousHtml: true, allowDangerousProtocol: true}]]) {
  test(`micromark HTML equals upstream (${mode})`, () => {
    const failures = []
    for (const c of corpus()) {
      const expected = upstream(c.markdown, options)
      let actual
      try {
        actual = micromark(c.markdown, Boolean(options.allowDangerousHtml), Boolean(options.allowDangerousProtocol))
      } catch (error) {
        actual = 'THREW ' + error.stack.split('\n').slice(0, 3).join(' | ')
      }
      if (actual !== expected) failures.push({name: c.name, markdown: c.markdown.slice(0, 200), expected: expected.slice(0, 300), actual: actual.slice(0, 300)})
    }
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 5)}, null, 1))
    assert.equal(failures.length, 0)
  })
}
