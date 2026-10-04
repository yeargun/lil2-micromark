// node scripts/build.mjs [--dev]
//   production: src/index.lil -> dist/ (searched, per lilscript.toml) and dist/browser/ (lilscript.browser.toml,
//               the `browser` condition)
//   --dev:      unsearched builds into .dev/ and .dev/browser/, plus the test-only event view
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
const compiler = process.env.LILSCRIPT_COMPILER ?? '/home/azureuser/lilscript-work/lil2/lilscript-lazyfn'
if (!existsSync(compiler)) throw new Error('Set LILSCRIPT_COMPILER to the pinned LilScript compiler')
const run = (cwd, config, out, mode) => {
  const start = process.hrtime.bigint()
  execFileSync(compiler, ['--config', config, '--target', 'js-module', '--mode', mode, '--out-dir', out, '--cache', 'off', '--jobs', '1'], {cwd, stdio: ['ignore', 'ignore', 'inherit']})
  console.error(`built ${config} in ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(2)} s`)
}
if (process.argv.includes('--dev')) {
  run('.', 'lilscript.toml', '.dev', 'development')
  run('.', 'lilscript.browser.toml', '.dev', 'development')
  run('test/support', 'events.toml', '../../.dev/events', 'development')
} else {
  run('.', 'lilscript.toml', '.', 'production')
  run('.', 'lilscript.browser.toml', '.', 'production')
}
