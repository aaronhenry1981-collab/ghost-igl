// Portable runner for the Support UI/contract tests.
// `node --test <dir>/` only works on Node 20; Node 21+ treats each argument as a
// file or glob, so directory arguments fail in CI (Node 24). Discover the files
// here instead of relying on shell globbing, which differs on Windows.
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const ROOTS = ['src/features/support', 'scripts/support']

function discover(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...discover(path))
    else if (entry.name.endsWith('.test.mjs')) found.push(path)
  }
  return found
}

const files = ROOTS.flatMap((dir) => discover(join(root, dir)))
  .map((file) => relative(root, file).split('\\').join('/'))
  .sort()

// An empty list must fail: a runner that silently tests nothing reads as green.
if (files.length === 0) {
  console.error(`support tests: no *.test.mjs files found under ${ROOTS.join(', ')}`)
  process.exit(1)
}

console.log(`support tests: ${files.length} files\n  ${files.join('\n  ')}`)
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
