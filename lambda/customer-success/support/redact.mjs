// Redaction before storage (docs/player-success/ARCHITECTURE.md §11).
//
// Every free-text field a player, an email or a staff member writes into a
// case passes through redactSensitive() BEFORE it is stored. The result only
// says WHICH kinds were removed; the original values are never returned,
// logged or stored.
//
// Matching runs on a normalized copy: invisible formatting characters are
// removed (stripInvisible) and the text is NFKC-normalized, so full-width
// digits, full-width colons, no-break spaces and zero-width joins inside a
// card number or a key do not hide it. The normalized text is what is stored.
//
// maskBillingRefs() is a separate, view-time helper: Stripe object ids are
// references (not secrets) and are stored, but roles without
// `billing.refs.full` only see their last 4 characters.

// ---- invisible characters ---------------------------------------------------------
// Bidi embeddings / overrides / isolates and directional marks.
const BIDI = /[‪-‮⁦-⁩‎‏؜]/g
// Zero-width characters, word joiner, BOM, soft hyphen, Mongolian vowel separator.
const ZERO_WIDTH = /[​‌⁠﻿᠎­]/g
// A zero-width JOINER is kept only inside an emoji sequence (family emoji etc.).
const ZWJ_OUTSIDE_EMOJI = /(?<!\p{Extended_Pictographic}️?)‍|‍(?!\p{Extended_Pictographic})/gu
// C0/C1 control characters except tab, line feed and carriage return.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

// Removes bidi overrides, zero-width and control characters. Used before
// length checks (an invisible-only text is empty) and before matching.
export function stripInvisible(value) {
  return String(value ?? '').replace(BIDI, '').replace(ZERO_WIDTH, '').replace(ZWJ_OUTSIDE_EMOJI, '').replace(CONTROL, '')
}

export function normalizeText(value) {
  return stripInvisible(value).normalize('NFKC')
}

// ---- card numbers -----------------------------------------------------------------
function luhnValid(digits) {
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

// A run of digit groups joined by up to two separator characters
// (space, tab, newline, dot, slash, no-break space, dash).
const DIGIT_RUN = /\d+(?:[\s./ -]{1,2}\d+)*/g

// Card windows inside one run: consecutive digit groups holding 13-19 digits
// in total that pass Luhn. A multi-group window must look like a card
// grouping (first group 4+ digits, every group 3-6 digits), so lists of
// small numbers, scores, dates and versions never qualify.
function redactCardsInRun(run, onRedact) {
  const groups = [...run.matchAll(/\d+/g)].map((m) => ({ start: m.index, end: m.index + m[0].length, digits: m[0] }))
  let out = ''
  let cursor = 0
  let i = 0
  while (i < groups.length) {
    let best = -1
    let digits = ''
    for (let j = i; j < groups.length; j += 1) {
      const g = groups[j]
      if (j > i && (g.digits.length < 3 || g.digits.length > 6 || groups[i].digits.length < 4 || groups[i].digits.length > 6)) break
      digits += g.digits
      if (digits.length > 19) break
      if (digits.length >= 13 && luhnValid(digits)) best = j
    }
    if (best === -1) {
      i += 1
      continue
    }
    out += run.slice(cursor, groups[i].start) + '[redacted card number]'
    cursor = groups[best].end
    onRedact()
    i = best + 1
  }
  return out + run.slice(cursor)
}

// ---- passwords --------------------------------------------------------------------
// A value that looks like a secret: 6+ characters, a letter, and a digit or
// a typical password symbol.
function secretish(token) {
  const core = String(token || '').replace(/^["'(]+|[.,;:!?)\]}"']+$/g, '')
  const full = String(token || '')
  return core.length >= 6 && core.length <= 128 && /[A-Za-z]/.test(core) && (/\d/.test(core) || /[!@#$%^&*_+=~?|<>]/.test(full))
}

// "the password is <word>" where <word> describes the password instead of
// being one.
const PASSWORD_IS_WORDS = new Set(`not wrong incorrect correct right invalid valid expired too being still the a an reset changed fine ok okay working rejected accepted saved required different same case empty blank short long weak strong missing lost forgotten locked fixed broken new old now also always never just only what that this it my your in on for from set sent stored protected hidden shown visible invisible known unknown mine yours there here gone case-sensitive supposed definitely probably right`.split(' '))

// Order matters: token shapes that contain other shapes go first.
const RULES = [
  {
    kind: 'bearer_token',
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
    replace: () => 'Bearer [redacted token]',
  },
  {
    kind: 'jwt',
    pattern: /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g,
    replace: () => '[redacted token]',
  },
  {
    // No leading word boundary: "key=xsk_live_..." still matches.
    kind: 'stripe_secret',
    pattern: /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{6,}/g,
    replace: () => '[redacted key]',
  },
  {
    kind: 'stripe_secret',
    pattern: /\brk_[A-Za-z0-9]{10,}/g,
    replace: () => '[redacted key]',
  },
  {
    kind: 'webhook_secret',
    pattern: /whsec_[A-Za-z0-9+/=]{6,}/g,
    replace: () => '[redacted key]',
  },
  {
    // Labelled: aws_secret_access_key=..., "aws secret key: ...", aws_secret ...
    kind: 'aws_secret',
    pattern: /\b(aws[_ -]?secret(?:[_ -]?access)?(?:[_ -]?key)?)\s*[=:]?\s*("[^"]*"|'[^']*'|[A-Za-z0-9/+=]{16,})/gi,
    replace: (m, label) => `${label}: [redacted]`,
  },
  {
    // A bare 40-character secret next to an access key id in the same text.
    kind: 'aws_secret',
    whole: (text) => /(?:AKIA|ASIA)[A-Z0-9]{16}/.test(text),
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    replace: (m) => (/[A-Z]/.test(m) && /[a-z]/.test(m) ? '[redacted key]' : null),
  },
  {
    // A bare 40-character base64 token with upper, lower, a digit and a / or +
    // (the shape of an AWS secret access key) is a secret wherever it appears.
    kind: 'aws_secret',
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    replace: (m) => (/[A-Z]/.test(m) && /[a-z]/.test(m) && /\d/.test(m) && /[/+]/.test(m) ? '[redacted key]' : null),
  },
  {
    kind: 'aws_access_key',
    pattern: /(?<![A-Z0-9])(?:AKIA|ASIA)[A-Z0-9]{16}(?![A-Z0-9])/g,
    replace: () => '[redacted key]',
  },
  {
    kind: 'password',
    pattern: /\b(pass(?:word|wd|code)?|pwd)\s*[:=]\s*("[^"]*"|'[^']*'|\S+)/gi,
    replace: (m, label) => `${label}: [redacted]`,
  },
  {
    // "my password is X" always; "the / our / new password is X" unless X is a
    // word describing the password ("the password is wrong").
    kind: 'password',
    pattern: /\b(?:(my|the|our|your|his|her|their|account|current|new|old|temp(?:orary)?)\s+)?(password|passcode|pwd)\s+(is|was)\s+("[^"]*"|'[^']*'|\S+)/gi,
    replace: (m, det, label, verb, value) => {
      if (/^\[redacted/.test(value)) return null
      const word = value.replace(/^["']|[.,;:!?"']+$/g, '').toLowerCase()
      if (String(det || '').toLowerCase() !== 'my' && !secretish(value) && PASSWORD_IS_WORDS.has(word)) return null
      return `${det ? `${det} ` : ''}${label} ${verb} [redacted]`
    },
  },
  {
    // "password Hunter2!" (no colon): only a secret-looking value.
    kind: 'password',
    pattern: /\b(password|passcode|pwd)\s+(?!is\b|was\b)("[^"]*"|\S+)/gi,
    replace: (m, label, value) => (secretish(value) ? `${label} [redacted]` : null),
  },
  {
    // "login player@example.test / Hunter2!": the value after the slash.
    kind: 'password',
    pattern: /\b(log[\s-]?in|sign[\s-]?in|credentials|creds|account)\b([:\s]+)([^\s/]+)(\s*\/\s*)(\S+)/gi,
    replace: (m, label, sep, user, slash, value) => {
      if (value.includes('@') || /^\[redacted/.test(value) || value.length < 4) return null
      if (!user.includes('@') && !secretish(value)) return null
      return `${label}${sep}${user}${slash}[redacted]`
    },
  },
  {
    kind: 'card_number',
    custom: true,
  },
]

export const REDACTION_KINDS = Object.freeze([...new Set(RULES.map((r) => r.kind))])

export function redactSensitive(text) {
  let out = normalizeText(text)
  const redactions = []
  for (const rule of RULES) {
    if (rule.custom) {
      out = out.replace(DIGIT_RUN, (run) => redactCardsInRun(run, () => redactions.push({ kind: rule.kind })))
      continue
    }
    if (rule.whole && !rule.whole(out)) continue
    out = out.replace(rule.pattern, (...args) => {
      const replacement = rule.replace(...args)
      if (replacement === null) return args[0]
      redactions.push({ kind: rule.kind })
      return replacement
    })
  }
  return { text: out, redactions }
}

// Stripe object ids that identify a customer's billing records.
const STRIPE_REF = /\b(cus|sub|pi|in|ch|pm|seti|cs|evt|re|si)_([A-Za-z0-9]{8,})\b/g

export function maskRef(value) {
  return String(value).replace(STRIPE_REF, (m, prefix, id) => (/\d/.test(id) ? `${prefix}_…${id.slice(-4)}` : m))
}

// Deep copy with every Stripe id masked to its last 4 characters.
export function maskBillingRefs(value) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return maskRef(value)
  if (Array.isArray(value)) return value.map(maskBillingRefs)
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskBillingRefs(v)]))
  return value
}
