import test from 'node:test';
import assert from 'node:assert/strict';
import { createStreamJobs, streamJobOwnerKey } from './stream-jobs.mjs';
const owner = { subject: 'user-123', email: 'USER@example.com', isAdmin: true };
const id = '12345678-1234-4123-8123-123456789012';
const second = '22345678-1234-4123-8123-123456789012';
const input = { images: [{ base64: 'NEVER_PERSIST_THIS_SCREENSHOT', media_type: 'image/png' }], context: 'PRIVATE_CONTEXT' };
const key = { ownerKey: streamJobOwnerKey(owner), jobId: id };
const clone = value => value == null ? value : structuredClone(value);
const gate = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function fixture(overrides = {}) {
  let time = 1000, seq = 0, calls = 0;
  const rows = new Map(), leases = new Map(), operations = [], frames = [];
  const rk = k => `${k.ownerKey}/${k.jobId}`;
  const adapters = {
    now: () => time, randomId: () => `token-${++seq}`, jobTimeoutMs: 100, ttlMs: 10000,
    acquireLease: async ({ ownerKey, token, now, leaseUntil }) => {
      operations.push('lease'); const old = leases.get(ownerKey);
      if (old && old.leaseUntil > now) return false;
      leases.set(ownerKey, { token, leaseUntil }); return true;
    },
    releaseLease: async ({ ownerKey, token }) => {
      const lease = leases.get(ownerKey); if (!lease || lease.token !== token) return false;
      lease.leaseUntil = 0; return true;
    },
    putJob: async row => { operations.push('receipt'); if (rows.has(rk(row))) return false; rows.set(rk(row), clone(row)); return true; },
    getJob: async key => clone(rows.get(rk(key))),
    claimJob: async ({ now, ...key }) => {
      const row = rows.get(rk(key)); if (!row || row.status !== 'pending' || row.deadlineAt <= now) return null;
      operations.push('claim'); row.status = 'model_started'; return clone(row);
    },
    completeJob: async ({ expectedStatus, patch, ...key }) => {
      const row = rows.get(rk(key)); if (!row || row.status !== expectedStatus) return false;
      operations.push('persist'); Object.assign(row, clone(patch)); return true;
    },
    execute: async (job, payload) => { calls++; operations.push('execute'); assert.deepEqual(payload, input); assert.equal(job.status, 'model_started'); return { statusCode: 200, body: '{"review":"ok"}' }; },
  };
  const engine = createStreamJobs({ ...adapters, ...overrides });
  const emit = frame => { operations.push(frame.type); frames.push(clone(frame)); };
  return { engine, adapters, rows, leases, operations, frames, emit, calls: () => calls,
    advance: ms => { time += ms; }, row: () => rows.get(rk(key)), submit: (extra = {}) => engine.submit({ owner, idempotencyKey: id, input, emit, ...extra }) };
}
test('lease and durable marker precede ACK; persisted result precedes final frame', async () => {
  const f = fixture(); const result = await f.submit();
  assert.deepEqual(f.operations, ['lease', 'receipt', 'claim', 'ack', 'execute', 'persist', 'result']);
  assert.equal(result.body.status, 'completed'); assert.equal(result.body.result.statusCode, 200);
  assert.equal(f.row().owner.isAdmin, true);
});
test('durable receipts never contain original input, image or private context', async () => {
  const f = fixture(); await f.submit();
  const serialized = JSON.stringify([...f.rows.values()]);
  assert.ok(!serialized.includes(input.images[0].base64)); assert.ok(!serialized.includes(input.context));
  assert.deepEqual(Object.keys(f.row()).sort(), ['ownerKey','jobId','owner','fingerprint','leaseToken','status','createdAt','deadlineAt','expiresAt','result','finishedAt'].sort());
});
test('simultaneous same-key submissions execute once, then poll/replay existing result', async () => {
  const started = gate(), blocked = gate(); let calls = 0;
  const f = fixture({ execute: async () => { calls++; started.resolve(); await blocked.promise; return { statusCode: 200 }; } });
  const original = f.submit(); await started.promise;
  const duplicate = await f.submit(); assert.equal(duplicate.body.status, 'model_started');
  assert.equal((await f.engine.poll({ owner, idempotencyKey: id })).body.status, 'model_started');
  blocked.resolve(); await original;
  assert.equal((await f.submit()).body.status, 'completed'); assert.equal(calls, 1);
});
test('twenty racing new keys per owner admit one execution', async () => {
  const blocked = gate(); let calls = 0;
  const f = fixture({ execute: async () => { calls++; await blocked.promise; return { statusCode: 200 }; } });
  const ids = Array.from({ length: 20 }, (_, i) => `${String(i).padStart(8, '0')}-1234-4123-8123-123456789012`);
  const submissions = ids.map(idempotencyKey => f.submit({ idempotencyKey }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1); assert.equal(f.rows.size, 1); blocked.resolve();
  const replies = await Promise.all(submissions); assert.equal(replies.filter(r => r.statusCode === 429).length, 19);
});
test('lost ACK, rejected emit and blocked/disconnected stream do not cancel durability', async () => {
  for (const emit of [() => { throw Error('disconnected'); }, () => Promise.reject(Error('lost ACK')), () => new Promise(() => {})]) {
    const f = fixture(); assert.equal((await f.submit({ emit })).body.status, 'completed');
    assert.equal(f.row().status, 'completed'); assert.equal(f.calls(), 1);
  }
});
test('different payload cannot reuse receipt, canonical key ordering can', async () => {
  const f = fixture(); await f.submit();
  assert.equal((await f.submit({ input: {} })).statusCode, 409);
  assert.equal((await f.submit({ input: { context: input.context, images: input.images } })).body.status, 'completed');
  assert.equal(f.calls(), 1);
});
test('cross-owner receipt reads are 404 and leases independent', async () => {
  const f = fixture(); await f.submit();
  for (const stranger of [{ ...owner, subject: 'other' }, { ...owner, email: 'other@example.com' }]) {
    assert.equal((await f.engine.poll({ owner: stranger, idempotencyKey: id })).statusCode, 404);
  }
  assert.equal((await f.submit({ owner: { ...owner, subject: 'other' } })).body.status, 'completed');
  assert.equal(f.calls(), 2);
});
test('uncertain insertion leaves pending receipt that is never restarted', async () => {
  let f;
  f = fixture({ putJob: async row => { await f.adapters.putJob(row); throw Error('lost insertion acknowledgement'); } });
  await assert.rejects(f.submit()); assert.equal(f.frames.length, 0); assert.equal(f.calls(), 0);
  assert.equal((await f.submit()).body.status, 'pending');
  f.advance(100); assert.equal((await f.submit()).body.status, 'indeterminate');
  assert.equal(f.calls(), 0);
});
test('claim committed then crashed before ACK: marker survives and never reexecutes after expiry', async () => {
  let f;
  f = fixture({ claimJob: async args => { await f.adapters.claimJob(args); throw Error('process died after claim'); } });
  await assert.rejects(f.submit()); assert.equal(f.row().status, 'model_started'); assert.equal(f.frames.length, 0);
  assert.equal((await f.submit()).body.status, 'model_started');
  f.advance(100); const reply = await f.submit();
  assert.equal(reply.body.status, 'indeterminate'); assert.match(reply.body.error, /Allowance may have been used/);
  assert.equal(f.calls(), 0);
});
test('expired admission lease permits new key without TTL deletion', async () => {
  const f = fixture();
  await f.adapters.acquireLease({ ownerKey: key.ownerKey, token: 'crashed', now: 1000, leaseUntil: 1100 });
  assert.equal((await f.submit()).statusCode, 429); f.advance(100);
  assert.equal(f.leases.size, 1); assert.equal((await f.submit()).body.status, 'completed');
});
test('stale release cannot clear newer lease after expired execution', async () => {
  const started = gate(), blocked = gate(); let calls = 0;
  const f = fixture({ execute: async () => { calls++; if (calls === 1) { started.resolve(); await blocked.promise; } return { statusCode: 200 }; } });
  const running = f.submit(); await started.promise; f.advance(100);
  await f.adapters.acquireLease({ ownerKey: key.ownerKey, token: 'new-owner-lease', now: 1100, leaseUntil: 1200 });
  blocked.resolve(); assert.equal((await running).body.status, 'indeterminate');
  assert.deepEqual(f.leases.get(key.ownerKey), { token: 'new-owner-lease', leaseUntil: 1200 });
  assert.equal((await f.submit()).body.status, 'indeterminate'); assert.equal(calls, 1);
});
test('completion acknowledgement lost preserves committed result', async () => {
  let f;
  f = fixture({ completeJob: async args => { const written = await f.adapters.completeJob(args); if (args.patch.status === 'completed') throw Error('ACK lost'); return written; } });
  assert.equal((await f.submit()).body.status, 'completed'); assert.equal(f.calls(), 1);
  assert.equal(f.frames.at(-1).status, 'completed');
});
test('result storage failure persists truthful indeterminate, never reexecutes', async () => {
  let f;
  f = fixture({ completeJob: async args => { if (args.patch.status === 'completed') throw Error('result write failed'); return f.adapters.completeJob(args); } });
  const reply = await f.submit(); assert.equal(reply.body.status, 'indeterminate');
  assert.match(reply.body.error, /Allowance may have been used/); assert.equal(f.row().status, 'indeterminate');
  assert.equal(f.frames.at(-1).status, 'indeterminate'); await f.submit(); assert.equal(f.calls(), 1);
});
test('total write outage emits no final result and preserves marker until recovery', async () => {
  let f, outage = true;
  f = fixture({ completeJob: async args => { if (outage) throw Error('database unavailable'); return f.adapters.completeJob(args); } });
  const reply = await f.submit(); assert.equal(reply.statusCode, 503); assert.equal(reply.body.status, 'indeterminate');
  assert.deepEqual(f.frames.map(frame => frame.type), ['ack']); assert.equal(f.row().status, 'model_started');
  await f.submit(); assert.equal(f.calls(), 1); outage = false; f.advance(100);
  assert.equal((await f.engine.poll({ owner, idempotencyKey: id })).body.status, 'indeterminate');
});
test('validation requires identity, UUID, mandatory lease adapters and <=150s deadline', async () => {
  const f = fixture();
  assert.equal((await f.submit({ owner: {} })).statusCode, 401);
  assert.equal((await f.submit({ idempotencyKey: 'bad' })).statusCode, 400);
  assert.throws(() => createStreamJobs({}), /adapters are required/);
  assert.throws(() => createStreamJobs({ ...f.adapters, jobTimeoutMs: 150001, ttlMs: 200000 }), /150 seconds/);
});

test('29.505s production latency and120s mocked processing complete past old24s cutoff',async()=>{
 for(const latency of [29505,120000]){
  let f;f=fixture({jobTimeoutMs:150000,ttlMs:86400000,execute:async(job,payload)=>{f.advance(latency);return f.adapters.execute(job,payload)}})
  assert.equal((await f.submit()).body.status,'completed');assert.equal(f.calls(),1)
  assert.equal((await f.engine.poll({owner,idempotencyKey:id})).body.result.statusCode,200)
 }
})
