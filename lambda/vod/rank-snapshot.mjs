const R6_RANK_TIERS = ['COPPER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'CHAMPION']
const R6_DIVISIONS = ['V', 'IV', 'III', 'II', 'I']

export const RANK_SNAPSHOT_SCHEMA = `{
  "rank": <exact string such as "Platinum III", or null>,
  "rp": <integer or null>,
  "kd": <number or null>,
  "win_rate": <number 0-100 or null>,
  "matches": <integer or null>,
  "wins": <integer or null>,
  "losses": <integer or null>,
  "season": <string or null>,
  "platform": <"PlayStation" | "Xbox" | "PC" | null>,
  "confidence": <number 0-1>,
  "visible_fields": [<field names read literally from the image>],
  "warnings": [<uncertainties or unreadable-field notes>]
}`

export function normalizeRankSnapshot(value) {
  if (!value || typeof value !== 'object') return null
  const raw = String(value.rank || '').trim().toUpperCase().replace(/\s+/g, ' ')
  const match = raw.match(new RegExp(`^(${R6_RANK_TIERS.join('|')})\\s+(${R6_DIVISIONS.join('|')})$`))
  const confidence = Number(value.confidence)
  if (!match || !Number.isFinite(confidence) || confidence < 0.75 || confidence > 1) return null
  const rank = `${match[1][0]}${match[1].slice(1).toLowerCase()} ${match[2]}`
  const nullableNumber = (v, min, max, integer = false) => {
    if (v == null || v === '') return null
    const n = Number(v)
    if (!Number.isFinite(n) || n < min || n > max) return null
    return integer ? Math.round(n) : Math.round(n * 100) / 100
  }
  return {
    rank,
    rp: nullableNumber(value.rp, 0, 10000, true),
    kd: nullableNumber(value.kd, 0, 20),
    win_rate: nullableNumber(value.win_rate, 0, 100),
    matches: nullableNumber(value.matches, 0, 100000, true),
    wins: nullableNumber(value.wins, 0, 100000, true),
    losses: nullableNumber(value.losses, 0, 100000, true),
    season: value.season ? String(value.season).slice(0, 60) : null,
    platform: ['PlayStation', 'Xbox', 'PC'].includes(value.platform) ? value.platform : null,
    confidence: Math.round(confidence * 100) / 100,
    visible_fields: Array.isArray(value.visible_fields) ? value.visible_fields.map((x) => String(x).slice(0, 40)).slice(0, 12) : [],
    warnings: Array.isArray(value.warnings) ? value.warnings.map((x) => String(x).slice(0, 160)).slice(0, 6) : [],
  }
}
