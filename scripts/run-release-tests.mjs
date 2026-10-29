// Portable runner for the production line's unit tests (site, Lambdas,
// generators). The customer-success and Support suites have their own
// scripts (npm run test:customer-success). Files are discovered here rather
// than with shell globs, which differ on Windows, and `node --test <dir>`
// is not used because Node 21+ rejects directory arguments.
import { readdirSync, mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const SKIP_DIRS = new Set(['node_modules', 'dist', 'public', '.git', '.aws-sam', '.aws-sam-customer-success', '.aws-sam-player-data'])
const OWN_SUITES = ['lambda/customer-success/', 'src/features/support/', 'scripts/support/']

function discover(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('backup-')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...discover(path))
    else if (entry.name.endsWith('.test.mjs')) found.push(path)
  }
  return found
}

const files = discover(root)
  .map((file) => relative(root, file).split('\\').join('/'))
  .filter((file) => !OWN_SUITES.some((prefix) => file.startsWith(prefix)))
  .sort()

if (files.length === 0) {
  console.error('release tests: no *.test.mjs files found')
  process.exit(1)
}

console.log(`release tests: ${files.length} files`)
// CLI --import on this runner is not inherited by node --test children.
// Enforce the guard at the actual test-process boundary on every platform,
// even when the caller forgot NODE_OPTIONS. Keep each run's evidence separate.
const guardLog = join(mkdtempSync(join(tmpdir(), 'recon-release-tests-')), 'netguard.log')
const guard = new URL('./test-netguard.mjs', import.meta.url).href
const nodeOptions = [process.env.NODE_OPTIONS, `--import=${guard}`].filter(Boolean).join(' ')
const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: root, stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: nodeOptions, NETGUARD_LOG: guardLog },
})
if (result.error) throw result.error
const attempts = existsSync(guardLog) ? readFileSync(guardLog, 'utf8').trim() : ''
if (attempts) {
  console.error(`release tests: outbound attempt blocked; inspect ${guardLog}`)
  process.exit(1)
}
console.log('release tests: child-process network guard enforced; 0 outbound attempts')
process.exit(result.status ?? 1)
