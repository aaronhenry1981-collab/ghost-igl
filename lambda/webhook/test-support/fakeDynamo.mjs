// In-memory stand-in for the DynamoDB Document client, used by the webhook
// tests. It enforces ConditionExpressions (attribute_exists/_not_exists,
// = <> < > <= >=, IN, AND, OR, NOT, parentheses) and the SET forms the webhook
// uses (plain values, if_not_exists(path, :v), a + b; ADD for number and
// string-set attributes; contains(path, :v) in conditions), so a test fails when a
// write that production would reject is accepted, or the reverse. Test-only:
// the Lambda deploy zips index.mjs, package.json and node_modules only.

const KEYS = {
  'ghost-igl-subscriptions': ['stripe_customer_id'],
  'ghost-igl-profiles': ['email'],
  'ghost-igl-referrals': ['referrer_email', 'referred_email'],
}
const INDEXES = {
  'email-index': 'email',
  'referred-email-index': 'referred_email',
}

export function conditionFailed(message = 'The conditional request failed') {
  const err = new Error(message)
  err.name = 'ConditionalCheckFailedException'
  return err
}

function tokenize(expr) {
  const tokens = []
  const re = /\s*(<>|<=|>=|=|<|>|\(|\)|,|\+|[#:]?[A-Za-z_][A-Za-z0-9_.]*)/y
  let m
  while (re.lastIndex < expr.length && (m = re.exec(expr))) tokens.push(m[1])
  if (re.lastIndex < expr.trimEnd().length) throw new Error(`fakeDynamo: cannot parse near "${expr.slice(re.lastIndex)}"`)
  return tokens
}

function resolveName(tok, names = {}) {
  return tok.startsWith('#') ? names[tok] : tok
}

// Recursive-descent evaluator for condition expressions.
export function evaluateCondition(expr, item, names = {}, values = {}) {
  if (!expr) return true
  const t = tokenize(expr)
  let i = 0
  const peek = () => t[i]
  const next = () => t[i++]
  const expect = (x) => { if (next() !== x) throw new Error(`fakeDynamo: expected ${x} in ${expr}`) }
  const operand = () => {
    const tok = next()
    if (tok === 'size') {
      expect('(')
      const cur = item?.[resolveName(next(), names)]
      expect(')')
      return cur instanceof Set ? cur.size : cur == null ? undefined : cur.length
    }
    if (tok.startsWith(':')) {
      if (!(tok in values)) throw new Error(`fakeDynamo: missing value ${tok} in ${expr}`)
      return values[tok]
    }
    return item?.[resolveName(tok, names)]
  }
  function primary() {
    const tok = peek()
    if (tok === 'NOT') { next(); return !primary() }
    if (tok === '(') { next(); const v = orExpr(); expect(')'); return v }
    if (tok === 'contains') {
      next(); expect('(')
      const path = resolveName(next(), names)
      expect(',')
      const v = operand()
      expect(')')
      const cur = item?.[path]
      if (cur instanceof Set || Array.isArray(cur)) return [...cur].includes(v)
      if (typeof cur === 'string') return cur.includes(v)
      return false
    }
    if (tok === 'attribute_exists' || tok === 'attribute_not_exists') {
      next(); expect('(')
      const path = resolveName(next(), names)
      expect(')')
      const exists = item != null && item[path] !== undefined
      return tok === 'attribute_exists' ? exists : !exists
    }
    const left = operand()
    const op = next()
    if (op === 'IN') {
      expect('(')
      const list = [operand()]
      while (peek() === ',') { next(); list.push(operand()) }
      expect(')')
      return list.includes(left)
    }
    const right = operand()
    if (left === undefined || right === undefined) return false // DynamoDB: comparing a missing attribute is false
    switch (op) {
      case '=': return left === right
      case '<>': return left !== right
      case '<': return left < right
      case '>': return left > right
      case '<=': return left <= right
      case '>=': return left >= right
      default: throw new Error(`fakeDynamo: unknown operator ${op} in ${expr}`)
    }
  }
  function andExpr() { let v = primary(); while (peek() === 'AND') { next(); const r = primary(); v = v && r } return v }
  function orExpr() { let v = andExpr(); while (peek() === 'OR') { next(); const r = andExpr(); v = v || r } return v }
  const result = orExpr()
  if (i !== t.length) throw new Error(`fakeDynamo: trailing tokens in ${expr}`)
  return result
}

// UpdateExpression with SET / ADD / REMOVE clauses in any order (the forms the
// webhook uses: plain values, if_not_exists, list_append, a + b, ADD numbers
// and sets, REMOVE attributes and list elements path[i]).
function splitTopLevel(str, sep = ',') {
  const parts = []; let depth = 0, cur = ''
  for (const ch of str) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === sep && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts.map((p) => p.trim())
}
function applyUpdate(expr, item, names = {}, values = {}) {
  const clauses = {}
  const re = /\b(SET|ADD|REMOVE)\b/g
  const marks = [...expr.matchAll(re)]
  marks.forEach((m, k) => { clauses[m[1]] = expr.slice(m.index + m[1].length, k + 1 < marks.length ? marks[k + 1].index : expr.length).trim() })
  let out = { ...item }
  const val = (term) => {
    term = term.trim()
    let m = term.match(/^if_not_exists\(\s*([#\w.]+)\s*,\s*(:\w+)\s*\)$/)
    if (m) { const p = resolveName(m[1], names); return out[p] !== undefined ? out[p] : values[m[2]] }
    m = term.match(/^list_append\(([\s\S]*)\)$/)
    if (m) { const [a, b] = splitTopLevel(m[1]); return [...val(a), ...val(b)] }
    if (term.startsWith(':')) return values[term]
    return out[resolveName(term, names)]
  }
  if (clauses.SET) {
    const assigns = splitTopLevel(clauses.SET).map((part) => {
      const [lhs, rhs] = part.split(/=(.*)/s)
      const terms = splitTopLevel(rhs, '+')
      return [resolveName(lhs.trim(), names), terms.length === 1 ? val(terms[0]) : terms.map(val).reduce((x, y) => x + y)]
    })
    for (const [k, v] of assigns) out[k] = structuredClone(v)
  }
  if (clauses.ADD) {
    for (const part of splitTopLevel(clauses.ADD)) {
      const [path, ph] = part.split(/\s+/)
      const key = resolveName(path, names), v = values[ph]
      if (v instanceof Set) out[key] = new Set([...(out[key] instanceof Set ? out[key] : []), ...v])
      else if (typeof v === 'number') out[key] = (out[key] || 0) + v
      else throw new Error(`fakeDynamo: ADD needs a number or a set (${ph})`)
    }
  }
  if (clauses.REMOVE) {
    const idx = {}
    for (const path of splitTopLevel(clauses.REMOVE)) {
      const m = path.match(/^([#\w]+)\[(\d+)\]$/)
      if (m) (idx[resolveName(m[1], names)] ||= []).push(Number(m[2]))
      else delete out[resolveName(path, names)]
    }
    for (const [key, list] of Object.entries(idx)) {
      if (!Array.isArray(out[key])) continue
      const drop = new Set(list)
      out[key] = out[key].filter((_, i) => !drop.has(i))
    }
  }
  return out
}

export function createFakeDynamo() {
  const tables = new Map()
  const log = []
  const table = (name) => { if (!tables.has(name)) tables.set(name, new Map()); return tables.get(name) }
  const keyOf = (name, obj) => (KEYS[name] || Object.keys(obj).slice(0, 1)).map((k) => obj[k]).join('|')

  async function send(cmd) {
    const entry = { kind: cmd.constructor.name, table: cmd.input.TableName, input: cmd.input, ok: false }
    log.push(entry)
    const result = await exec(cmd)
    entry.ok = true
    return result
  }

  async function exec(cmd) {
    const kind = cmd.constructor.name
    const input = cmd.input
    switch (kind) {
      case 'GetCommand': return { Item: structuredClone(table(input.TableName).get(keyOf(input.TableName, input.Key))) }
      case 'PutCommand': {
        const t = table(input.TableName), k = keyOf(input.TableName, input.Item)
        if (!evaluateCondition(input.ConditionExpression, t.get(k), input.ExpressionAttributeNames, input.ExpressionAttributeValues)) throw conditionFailed()
        t.set(k, structuredClone(input.Item))
        return {}
      }
      case 'UpdateCommand': {
        const t = table(input.TableName), k = keyOf(input.TableName, input.Key)
        const existing = t.get(k)
        if (!evaluateCondition(input.ConditionExpression, existing, input.ExpressionAttributeNames, input.ExpressionAttributeValues)) throw conditionFailed()
        const next = applyUpdate(input.UpdateExpression, { ...(existing || {}), ...input.Key }, input.ExpressionAttributeNames, input.ExpressionAttributeValues)
        t.set(k, next)
        return input.ReturnValues && input.ReturnValues !== 'NONE' ? { Attributes: structuredClone(next) } : {}
      }
      case 'QueryCommand': {
        const t = table(input.TableName)
        const [, attr, ph] = input.KeyConditionExpression.match(/^\s*(\w+)\s*=\s*(:\w+)\s*$/) || []
        const field = input.IndexName ? INDEXES[input.IndexName] : attr
        let items = [...t.values()].filter((it) => it[field] === input.ExpressionAttributeValues[ph])
        if (input.Limit) items = items.slice(0, input.Limit)
        return { Items: structuredClone(items), Count: items.length }
      }
      case 'TransactWriteCommand': {
        const plan = input.TransactItems.map((ti) => ti.Put ? ['Put', ti.Put] : ['Update', ti.Update])
        for (const [op, p] of plan) {
          const t = table(p.TableName)
          const k = keyOf(p.TableName, op === 'Put' ? p.Item : p.Key)
          if (!evaluateCondition(p.ConditionExpression, t.get(k), p.ExpressionAttributeNames, p.ExpressionAttributeValues)) {
            const err = new Error('Transaction cancelled'); err.name = 'TransactionCanceledException'; throw err
          }
        }
        for (const [op, p] of plan) {
          const t = table(p.TableName)
          if (op === 'Put') t.set(keyOf(p.TableName, p.Item), structuredClone(p.Item))
          else { const k = keyOf(p.TableName, p.Key); t.set(k, applyUpdate(p.UpdateExpression, { ...(t.get(k) || {}), ...p.Key }, p.ExpressionAttributeNames, p.ExpressionAttributeValues)) }
        }
        return {}
      }
      default: throw new Error(`fakeDynamo: unsupported command ${kind}`)
    }
  }
  return {
    send,
    log,
    reset() { tables.clear(); log.length = 0 },
    get(tableName, key) { return structuredClone(table(tableName).get(keyOf(tableName, key))) },
    put(tableName, item) { table(tableName).set(keyOf(tableName, item), structuredClone(item)) },
    all(tableName) { return [...table(tableName).values()].map((x) => structuredClone(x)) },
    // Applied (successful) writes only; rejected conditional writes are excluded.
    writes(tableName, kinds = ['PutCommand', 'UpdateCommand']) { return log.filter((l) => l.ok && l.table === tableName && kinds.includes(l.kind)) },
  }
}
