// node scripts/build.mjs [--dev]
//   production: src/index.lil -> dist/ (searched, per lilscript.toml)
//   --dev:      unsearched builds into .dev/: the package and the test-only event view
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
const compiler = process.env.LILSCRIPT_COMPILER ?? '/home/azureuser/lilscript-work/remark-fix/lilscript-8ff44f'
if (!existsSync(compiler)) throw new Error('Set LILSCRIPT_COMPILER to the pinned LilScript compiler')
const run = (cwd, config, out, mode) =>
  execFileSync(compiler, ['--config', config, '--target', 'js-module', '--mode', mode, '--out-dir', out, '--cache', 'off', '--jobs', '1'], {cwd, stdio: ['ignore', 'ignore', 'inherit']})
if (process.argv.includes('--dev')) {
  run('.', 'lilscript.toml', '.dev', 'development')
  run('test/support', 'events.toml', '../../.dev/events', 'development')
} else {
  run('.', 'lilscript.toml', '.', 'production')
}
