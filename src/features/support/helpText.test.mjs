import test from 'node:test'
import assert from 'node:assert/strict'
import { groupBySection, HELP_SECTIONS, highlightSegments, isReviewed, parseArticleBody, parseInline, queryTerms, rankArticles, sectionForCategory } from './helpText.mjs'

test('query terms drop stopwords, punctuation and duplicates', () => {
  assert.deepEqual(queryTerms("Why is my rank WRONG? rank isn't updating"), ['rank', 'wrong', 'updating'])
  assert.deepEqual(queryTerms(''), [])
})

test('highlight segments round-trip the text and mark prefix matches', () => {
  const text = 'Ranked stats refresh after each ranked match.'
  const segs = highlightSegments(text, 'rank refresh')
  assert.equal(segs.map((s) => s.text).join(''), text)
  assert.deepEqual(segs.filter((s) => s.match).map((s) => s.text), ['Ranked', 'refresh', 'ranked'])
  assert.deepEqual(highlightSegments('abc', ''), [{ text: 'abc', match: false }])
  assert.deepEqual(highlightSegments('', 'x'), [])
  // Regex metacharacters in the query are inert.
  assert.equal(highlightSegments('a+b (c)', 'a+b (c').map((s) => s.text).join(''), 'a+b (c)')
})

test('inline parser keeps internal links only', () => {
  assert.deepEqual(parseInline('Go to [Account](/account) now'), [
    { type: 'text', text: 'Go to ' }, { type: 'link', text: 'Account', href: '/account' }, { type: 'text', text: ' now' },
  ])
  assert.deepEqual(parseInline('[x](javascript:alert(1))').map((t) => t.type), ['text', 'text'])
  assert.deepEqual(parseInline('[x](https://evil.example)')[0], { type: 'text', text: 'x' })
  assert.deepEqual(parseInline('[x](//evil.example)')[0], { type: 'text', text: 'x' })
  assert.deepEqual(parseInline('**bold** and `code`').map((t) => t.type), ['strong', 'text', 'code'])
})

test('article body parses headings, lists, notes and paragraphs', () => {
  const blocks = parseArticleBody('## Check first\nLine one\ncontinues.\n\n- a\n- b\n1. one\n2. two\n\n> Recon never asks for your password.\n### Small')
  assert.deepEqual(blocks.map((b) => b.type), ['h2', 'p', 'ul', 'ol', 'note', 'h3'])
  assert.equal(blocks[1].inline[0].text, 'Line one continues.')
  assert.equal(blocks[2].items.length, 2)
  assert.equal(blocks[3].items.length, 2)
  assert.deepEqual(parseArticleBody(''), [])
  // Raw HTML stays text.
  assert.equal(parseArticleBody('<img src=x onerror=alert(1)>')[0].inline[0].type, 'text')
})

test('local ranking uses title > summary > body and synonyms', () => {
  const arts = [
    { slug: 'a', title: 'Billing receipts', summary: 'Find a charge', body: '' },
    { slug: 'b', title: 'Why your rank looks off', summary: 'Snapshots and freshness', body: 'rank rank' },
    { slug: 'c', title: 'Desktop install', summary: '', body: 'mentions rank once' },
  ]
  assert.deepEqual(rankArticles(arts, 'rank').map((a) => a.slug), ['b', 'c'])
  assert.deepEqual(rankArticles(arts, 'mmr').map((a) => a.slug), ['b', 'c'])
  assert.deepEqual(rankArticles(arts, 'charged').map((a) => a.slug), ['a'])
  assert.equal(rankArticles(arts, '').length, 3)
})

test('grouping by job section (derived from the backend category) and review status', () => {
  const g = groupBySection([{ category: 'vod_analysis' }, { category: 'replay_upload' }, { category: 'nope' }])
  assert.equal(g.sections.length, HELP_SECTIONS.length)
  assert.equal(g.sections.find((s) => s.id === 'vod').articles.length, 2)
  assert.equal(g.other.length, 1)
  assert.equal(sectionForCategory('account_login').id, 'account')
  assert.equal(sectionForCategory('safety_report'), null)
  assert.deepEqual(rankArticles([{ slug: 'k', title: 'x', keywords: ['gamertag'] }], 'gamertag').map((a) => a.slug), ['k'], 'backend keywords rank')
  assert.equal(isReviewed({ status: 'reviewed' }), true)
  assert.equal(isReviewed({ status: 'draft' }), false)
})
