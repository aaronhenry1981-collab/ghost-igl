#!/usr/bin/env node
// Local-only release hook. Run after building the existing SubscriptionFunction
// into a restricted staging directory OUTSIDE the source checkout. The expected
// digest is supplied from the approved private release receipt, not from CI.
// This command never builds, uploads, modifies AWS, or logs member content.
import { constants, closeSync, lstatSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { encodeOperatorHubCatalog } from '../lambda/subscription/operator-hub.mjs'

const privateFile = 'operator-hub-content.json'
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const usage = 'Usage: node scripts/stage-operator-hub-package.mjs <private JSON path> <expected SHA-256> <restricted SubscriptionFunction build directory>'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

function isWithin(path, root) {
  const suffix = relative(root, path)
  return suffix === '' || (!isAbsolute(suffix) && suffix !== '..' && !suffix.startsWith('..' + sep))
}
function privatePath(path, type) {
  const resolved = resolve(path)
  const stats = lstatSync(resolved)
  if (resolved !== realpathSync(resolved) || (stats.mode & 0o077) !== 0 ||
      (type === 'directory' ? !stats.isDirectory() : !stats.isFile())) {
    throw new Error('Package staging requires owner-only real paths; no symlinks.')
  }
  if (isWithin(resolved, repositoryRoot)) throw new Error('Do not stage private content inside the source checkout.')
  return resolved
}

export function stageOperatorHubPackage(source, expected, output) {
  if (process.platform === 'win32') throw new Error('Cannot verify owner-only access on this platform; use an approved restricted POSIX staging environment.')
  if (!source || !/^[a-f0-9]{64}$/.test(expected || '') || !output) throw new Error(usage)
  if (basename(source) !== privateFile || basename(output) !== 'SubscriptionFunction') {
    throw new Error('Use the exact private JSON filename and SubscriptionFunction staging directory.')
  }
  const corpusPath = privatePath(source, 'file')
  privatePath(dirname(corpusPath), 'directory')
  const packagePath = privatePath(output, 'directory')
  privatePath(dirname(packagePath), 'directory')

  const packageJson = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf8'))
  const handlerCode = readFileSync(join(packagePath, 'index.mjs'), 'utf8')
  const moduleCode = readFileSync(join(packagePath, 'operator-hub.mjs'), 'utf8')
  if (packageJson?.name !== 'ghost-igl-subscription-api' || !handlerCode.includes('./operator-hub.mjs') ||
      !moduleCode.includes('encodeOperatorHubCatalog')) {
    throw new Error('Target is not a built Operator Hub SubscriptionFunction package.')
  }
  const data = readFileSync(corpusPath)
  if (hash(data) !== expected) throw new Error('Private artifact does not match the approved release digest.')
  let decoded, projected
  try {
    decoded = JSON.parse(data.toString('utf8'))
    projected = JSON.parse(encodeOperatorHubCatalog(decoded))
  } catch { throw new Error('Private artifact schema is invalid.') }
  if (!isDeepStrictEqual(decoded, projected)) throw new Error('Private artifact contains fields outside the approved response contract.')

  // Exclusive write: never replace a preexisting package asset or follow a link.
  const file = join(packagePath, privateFile)
  const fd = openSync(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { writeFileSync(fd, data) } finally { closeSync(fd) }
  if (hash(readFileSync(file)) !== expected) throw new Error('Staged artifact did not round-trip byte-for-byte; quarantine this package.')
  return expected
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 5) throw new Error(usage)
    const digest = stageOperatorHubPackage(...process.argv.slice(2))
    console.log(`Private Operator Hub artifact staged in SubscriptionFunction; SHA-256 ${digest}`)
  } catch (error) {
    // Do not print unauthorized paths, parser text or filesystem payloads.
    const safe = error instanceof Error && !('code' in error) ? error.message : 'Cannot stage the artifact; check package paths and permissions.'
    console.error(safe)
    process.exitCode = 1
  }
}
