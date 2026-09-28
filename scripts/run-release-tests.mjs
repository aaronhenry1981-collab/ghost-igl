// Portable runner for the production line's unit tests (site, Lambdas,
// generators). The customer-success and Support suites have their own
// scripts (npm run test:customer-success). Files are discovered here rather
// than with shell globs, which differ on Windows, and `node --test <dir>`
// is not used because Node 21+ rejects directory arguments.
import { readdirSync } from 'node:fs'
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
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
