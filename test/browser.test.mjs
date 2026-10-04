// The browser build (the `browser` condition) in real browsers: named references are decoded by the
// document there, so this is where that path is checked. Same input, same HTML as upstream micromark.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'
import * as playwright from 'playwright-core'
import {micromark as upstream} from 'micromark'
import {corpus} from './corpus.mjs'
const artifact = new URL(process.env.LIL2_BROWSER_ARTIFACT ?? '../dist/browser/micromark.js', import.meta.url)
const cases = corpus()
const modes = [['safe', {}], ['dangerous', {allowDangerousHtml: true, allowDangerousProtocol: true}]]

for (const name of ['chromium', 'firefox']) {
  test(`browser build in ${name}: HTML equals upstream`, async () => {
    const code = await readFile(artifact, 'utf8')
    const browser = await playwright[name].launch()
    try {
      const page = await browser.newPage()
      await page.route('http://lil2.test/**', route => route.fulfill(route.request().url().endsWith('.js')
        ? {contentType: 'text/javascript', body: code}
        : {contentType: 'text/html', body: '<!doctype html><title>lil2</title>'}))
      await page.goto('http://lil2.test/')
      const actual = await page.evaluate(async ({markdowns, modes}) => {
        const {micromark} = await import('/micromark.js')
        return modes.map(([, o]) => markdowns.map(m => {
          try { return micromark(m, Boolean(o.allowDangerousHtml), Boolean(o.allowDangerousProtocol)) } catch (e) { return 'THREW ' + e }
        }))
      }, {markdowns: cases.map(c => c.markdown), modes})
      const failures = []
      modes.forEach(([mode, options], m) => cases.forEach((c, i) => {
        const expected = upstream(c.markdown, options)
        if (actual[m][i] !== expected) failures.push({mode, name: c.name, markdown: c.markdown.slice(0, 120), expected: expected.slice(0, 200), actual: actual[m][i].slice(0, 200)})
      }))
      if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 5)}, null, 1))
      assert.equal(failures.length, 0)
    } finally {
      await browser.close()
    }
  })
}
