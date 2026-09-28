import test from 'node:test'
import assert from 'node:assert/strict'
import { findStale } from './check-patch-facts.mjs'

const rules = (text) => findStale(text).map((f) => f.rule)

test('flags each stale Y11S3.1 value when it is tied to its operator, gadget or weapon', () => {
  const stale = {
    'skeleton-key-ammo-31': ["Buck's Skeleton Key carries 31 rounds.", 'You get 31 shells for the Skeleton Key.'],
    'armor-panel-9-melee-hits': ['An Armor Panel takes 9 melee hits to break.', 'Nine hits break a Castle barricade.'],
    'dread-mine-gas-2s': ["Fenrir's Dread Mine gas reaches full range in 2 seconds.", 'F-NATT gas expands to max range after 2s.'],
    'evil-eye-battery-8s': ["Maestro's Evil Eye laser battery lasts 8 seconds.", 'Evil Eye battery: 8 seconds of fire.'],
    'exothermic-200-hp': ['The Exothermic Charge deals 200 HP to anyone caught in it.', 'It does 200 damage (Exothermic).'],
    'sledge-hammer-swing-1s': ["Sledge's hammer swing takes 1 second.", 'Each Breaching Hammer swing is instant.'],
    'm1014-damage-28': ['M1014 damage: 28 per pellet.', '28 damage M1014 pellets.'],
    'spas15-damage-24': ['The SPAS-15 hits for 24.', 'SPAS-15 damage 24.'],
    'noor-le-roc-auto-retract': ["Hit Montagne with the Horus Lance and his Le Roc auto-retracts, so push him then."],
    'noor-shield-no-device-throw': ['Shield operators cannot throw devices while a Horus Lance is stuck in them.', 'Once Noor lands a lance, shields can not use gadgets.'],
    'noor-lance-wall-press': ['Press the embedded lance against a wall to take no damage.'],
    'noor-animation-cancel-removal': ['Animation-cancel to rip the Horus Lance off instantly.'],
  }
  for (const [rule, lines] of Object.entries(stale)) {
    for (const line of lines) assert.ok(rules(line).includes(rule), `${rule} should flag: ${line}`)
  }
})

test('allows current values, historical labels and corrected Noor behaviour', () => {
  const fine = [
    'Skeleton Key total ammo increased to 36 (was 31).',
    'An Armor Panel now takes 10 melee hits to destroy (was 9).',
    'F-NATT Dread Mine gas now reaches maximum range in 1.9 seconds (was 2 seconds).',
    'Evil Eye battery life increased to 9 seconds (was 8 seconds).',
    'Exothermic Charge damage increased to 220 HP (was 200 HP).',
    'Breaching Hammer swing time reduced to 0.8 seconds (was 1 second).',
    'Each swing takes 0.8 seconds as of Y11S3.1 (was 1 second).',
    'M1014 damage increased to 30 (was 28).',
    'SPAS-15 damage increased to 26 (was 24).',
    "{ item: 'M1014', before: '28 HP', after: '30 HP' }",
    "Montagne's Le Roc Shield no longer auto-retracts just because a Horus Lance hits it.",
    'Shield Operators can throw devices while affected by a Horus Lance.',
    'Pressing an embedded Horus Lance against a wall no longer prevents its damage.',
    'Cancelling the animation no longer removes a Horus Lance immediately from a shield carried on the back.',
    "Fixed - Montagne's Le Roc Shield auto-retracts when hit with Noor's Horus Lance.",
  ]
  for (const line of fine) assert.deepEqual(rules(line), [], line)
})

test('never matches unrelated uses of the old numbers', () => {
  const unrelated = [
    'Thatcher EMP disables electronics for ~9 seconds, including Maestro Evil Eyes.',
    "{ op: 'Buck', win: '36%' }",
    'Kali pump time to 0.8s and ammo to 51.',
    'Mute: Nitro cell is a 200dmg play.',
    'Round 24 of 28 in the tournament.',
    'Castle barricades take 4-6 hits to break with normal weapons.',
    'Hibana pellets activate after a 4-second timer.',
    'Top 31 picks for Bank.',
  ]
  for (const line of unrelated) assert.deepEqual(rules(line), [], line)
})
