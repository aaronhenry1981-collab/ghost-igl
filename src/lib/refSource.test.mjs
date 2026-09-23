import test from 'node:test'
import assert from 'node:assert/strict'

import { captureRefSource, getCampaignAttribution, getRefSource, setCampaignAttribution } from './refSource.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

function setBrowser({ search = '', hash = '', referrer = '' } = {}) {
  globalThis.localStorage = memoryStorage()
  globalThis.window = { location: { search, hash } }
  globalThis.document = { referrer }
}

test('captures complete UTM attribution and keeps the source available for profiles', () => {
  setBrowser({
    search: '?utm_source=tiktok&utm_medium=social&utm_campaign=bank_defense&utm_content=hook_a',
  })

  captureRefSource()

  assert.equal(getRefSource(), 'tiktok')
  assert.deepEqual(getCampaignAttribution(), {
    source: 'tiktok',
    medium: 'social',
    campaign: 'bank_defense',
    content: 'hook_a',
  })
})

test('infers TikTok from the referrer when the app receives no UTM query', () => {
  setBrowser({ referrer: 'https://www.tiktok.com/@recon6coach/video/123' })

  captureRefSource()

  assert.equal(getRefSource(), 'tiktok')
  assert.equal(getCampaignAttribution()?.source, 'tiktok')
})

test('preserves first-touch attribution on a later direct visit', () => {
  setBrowser({ search: '?utm_source=reddit&utm_campaign=launch' })
  captureRefSource()

  window.location.search = ''
  document.referrer = ''
  captureRefSource()

  assert.equal(getRefSource(), 'reddit')
  assert.equal(getCampaignAttribution()?.campaign, 'launch')
})

test('records the short TikTok profile route as a campaign touch', () => {
  setBrowser()

  setCampaignAttribution({
    source: 'tiktok',
    medium: 'social',
    campaign: 'profile_bio',
    content: 'bank_defense',
  })

  assert.equal(getRefSource(), 'tiktok')
  assert.deepEqual(getCampaignAttribution(), {
    source: 'tiktok',
    medium: 'social',
    campaign: 'profile_bio',
    content: 'bank_defense',
  })
})
