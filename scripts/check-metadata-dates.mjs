#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../public/blog/', import.meta.url)
const errors = []
for (const file of readdirSync(dir).filter(name => name.endsWith('.html') && name !== 'index.html')) {
  const html = readFileSync(new URL(file, dir), 'utf8')
  const articleScripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => { try { return JSON.parse(match[1]) } catch { return null } })
    .filter(value => value?.['@type'] === 'Article')
  if (articleScripts.length !== 1) {
    errors.push(`${file}: expected exactly one valid Article JSON-LD block`)
    continue
  }
  const { datePublished, dateModified } = articleScripts[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePublished || '')) errors.push(`${file}: invalid datePublished`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateModified || '')) errors.push(`${file}: invalid dateModified`)
  if (datePublished && dateModified && dateModified < datePublished) errors.push(`${file}: dateModified precedes datePublished`)
}
if (errors.length) {
  console.error(`Metadata date check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('Metadata dates are consistent')
