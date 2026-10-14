// Test-only preload: records and blocks every outbound TCP connection that is
// not loopback, in every process that loads it (NODE_OPTIONS propagates to the
// `node --test` child processes). Used by the webhook billing CI job so a test
// can never reach AWS or Stripe; the job fails if the log has any entry.
//   NETGUARD_LOG=netguard.log NODE_OPTIONS="--import=./scripts/test-netguard.mjs" node --test ...
// Hooks net.Socket.prototype.connect, which every TCP/TLS client connection
// goes through (http/https agents keep their own reference to
// net.createConnection, so patching that alone is not enough).
import net from 'node:net'
import dns from 'node:dns'
import { appendFileSync } from 'node:fs'

const LOG = process.env.NETGUARD_LOG
const record = (kind, target) => { if (LOG) appendFileSync(LOG, `${process.pid}\t${kind}\t${target}\n`) }
const loopback = (h) => h === 'localhost' || h === '127.0.0.1' || h === '::1'

const origConnect = net.Socket.prototype.connect
net.Socket.prototype.connect = function (...args) {
  const o = Array.isArray(args[0]) ? args[0][0] : args[0]
  let host, port
  if (o && typeof o === 'object') {
    if (o.path) return origConnect.apply(this, args) // local IPC (test runner)
    host = o.host || o.hostname; port = o.port
  } else { port = o; host = typeof args[1] === 'string' ? args[1] : 'localhost' }
  host = host || 'localhost'
  if (!loopback(host)) {
    record('blocked', `${host}:${port}`)
    const err = new Error(`netguard: blocked outbound ${host}:${port}`)
    process.nextTick(() => this.destroy(err))
    return this
  }
  return origConnect.apply(this, args)
}
const origLookup = dns.lookup
dns.lookup = function (host, ...rest) { if (!loopback(host)) record('dns', host); return origLookup.call(this, host, ...rest) }
