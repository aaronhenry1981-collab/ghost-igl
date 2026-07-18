import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalizeUrl, contentHash, extractArticleUrls } from './index.mjs'

test('canonicalizeUrl strips query and fragment from official R6 URLs', () => {
  assert.equal(
    canonicalizeUrl('https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/test?foo=1#x'),
    'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/test',
  )
})

test('canonicalizeUrl rejects non-Ubisoft and lookalike hosts', () => {
  assert.throws(() => canonicalizeUrl('https://evil.example/news-updates/x'), /source_not_allowed/)
  assert.throws(() => canonicalizeUrl('https://www.ubisoft.com.evil.example/en-us/game/rainbow-six/siege/news-updates/x'), /source_not_allowed/)
})

test('extractArticleUrls returns unique allowed article links only', () => {
  const html = [
    '<a href="/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2">one</a>',
    '<a href="https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2?x=1">duplicate</a>',
    '<a href="https://example.com/en-us/game/rainbow-six/siege/news-updates/nope">external</a>',
  ].join('')
  assert.deepEqual(extractArticleUrls(html, 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates'), [
    'https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/patch-notes/y10s2',
  ])
})

test('contentHash is deterministic SHA-256', () => {
  assert.equal(contentHash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})
