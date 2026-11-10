import { createHash, randomUUID } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = value => createHash('sha256').update(value).digest('hex');
const active = status => status === 'pending' || status === 'model_started';
const INDETERMINATE = 'Review outcome is unavailable. Allowance may have been used. This request will not be retried automatically.';
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function streamJobOwnerKey(owner) {
  if (!owner || typeof owner.subject !== 'string' || !owner.subject.trim() || typeof owner.email !== 'string' || !owner.email.trim()) return null;
  return hash(JSON.stringify([owner.subject, owner.email.trim().toLowerCase()]));
}

/**
 * Receipts store only whitelisted identity, timestamps, hashes and status/result.
 * No input persistence adapter exists. execute receives the request's in-memory input.
 * putJob(row) conditionally inserts an absent receipt, returning boolean.
 * getJob({ownerKey,jobId}) must be a strongly consistent owner-isolated read.
 * claimJob({ownerKey,jobId,now}) atomically changes pending -> model_started only
 * when deadlineAt > now and returns the updated receipt or null.
 * completeJob({ownerKey,jobId,expectedStatus,patch}) conditionally updates that status.
 * acquireLease({ownerKey,token,now,leaseUntil}) replaces only absent/expired leases.
 * releaseLease({ownerKey,token}) expires only the matching token; both return boolean.
 * Claimed receipts never execute again. This is not exactly-once billing: a crash
 * after claim can lose the result or consume allowance. Receipt retention defines
 * the idempotency window; TTL cleanup is asynchronous and is not lease enforcement.
 * emit should write synchronously. Async failures are observed but never awaited,
 * so a disconnected or indefinitely blocked client cannot stop durable processing.
 */
export function createStreamJobs({ acquireLease, releaseLease, putJob, getJob, claimJob, completeJob, execute,
  now = Date.now, randomId = randomUUID, jobTimeoutMs = 150_000, ttlMs = 86_400_000 }) {
  for (const fn of [acquireLease, releaseLease, putJob, getJob, claimJob, completeJob, execute]) {
    if (typeof fn !== 'function') throw new Error('All atomic receipt and owner lease adapters are required');
  }
  if (!(jobTimeoutMs > 0 && jobTimeoutMs <= 150_000 && ttlMs > jobTimeoutMs)) throw new Error('Execution deadline must be at most 150 seconds and shorter than receipt retention');
  const keyFor = (owner, idempotencyKey) => {
    const ownerKey = streamJobOwnerKey(owner);
    if (!ownerKey) return { error: { statusCode: 401, body: { error: 'Authentication required' } } };
    if (typeof idempotencyKey !== 'string' || !UUID.test(idempotencyKey)) return { error: { statusCode: 400, body: { error: 'A UUID request ID is required' } } };
    return { ownerKey, jobId: idempotencyKey.toLowerCase() };
  };
  const response = job => ({ statusCode: active(job.status) ? 202 : 200, body: {
    jobId: job.jobId, status: job.status,
    ...(job.status === 'completed' ? { result: job.result } : {}),
    ...(job.status === 'indeterminate' ? { error: job.error || INDETERMINATE } : {}),
  } });
  const emitSafe = (emit, frame) => { try { Promise.resolve(emit?.(frame)).catch(() => {}); } catch { /* Client disconnect is not execution cancellation. */ } };
  const release = async job => { try { await releaseLease({ ownerKey: job.ownerKey, token: job.leaseToken }); } catch { /* Explicit lease expiry is the crash-safe fallback. */ } };
  const keyOf = job => ({ ownerKey: job.ownerKey, jobId: job.jobId });
  const unavailable = job => ({ ...job, status: 'indeterminate', error: INDETERMINATE });
  async function expire(job) {
    if (!active(job.status) || job.deadlineAt > now()) return job;
    const patch = { status: 'indeterminate', error: INDETERMINATE, finishedAt: now() };
    if (await completeJob({ ...keyOf(job), expectedStatus: job.status, patch })) {
      await release(job); return { ...job, ...patch };
    }
    const current = await getJob(keyOf(job));
    if (!current) throw new Error('Receipt unavailable after conditional expiry');
    // A concurrent pending -> model_started claim may win the first condition.
    // Resolve that state too rather than presenting a fabricated durable terminal.
    if (active(current.status) && current.deadlineAt <= now()) return expire(current);
    return current;
  }
  async function settleUnknown(job) {
    // A lost write acknowledgement may hide a successfully persisted result.
    // Never overwrite it, and never call execute again to reconstruct it.
    try {
      const current = await getJob(keyOf(job));
      if (current && !active(current.status)) { await release(job); return { job: current, durable: true }; }
      if (current && await completeJob({ ...keyOf(job), expectedStatus: current.status,
        patch: { status: 'indeterminate', error: INDETERMINATE, finishedAt: now() } })) {
        await release(job); return { job: unavailable(current), durable: true };
      }
    } catch { /* Leave the durable claim and lease untouched until explicit expiry. */ }
    return { job: unavailable(job), durable: false };
  }
  return {
    async poll({ owner, idempotencyKey }) {
      const key = keyFor(owner, idempotencyKey);
      if (key.error) return key.error;
      const job = await getJob(key);
      if (!job || job.ownerKey !== key.ownerKey) return { statusCode: 404, body: { error: 'Review not found' } };
      return response(await expire(job));
    },
    async submit({ owner, idempotencyKey, input, emit }) {
      const key = keyFor(owner, idempotencyKey);
      if (key.error) return key.error;
      // Copy only in memory; fingerprint JSON payload, never store the payload itself.
      const payload = JSON.parse(JSON.stringify(input));
      const fingerprint = hash(canonical(payload));
      const existing = await getJob(key);
      const replay = async job => {
        if (job.ownerKey !== key.ownerKey) return { statusCode: 404, body: { error: 'Review not found' } };
        if (job.fingerprint !== fingerprint) return { statusCode: 409, body: { error: 'Request ID already used for a different review' } };
        const reply = response(await expire(job));
        emitSafe(emit, { type: active(reply.body.status) ? 'ack' : 'result', ...reply.body });
        return reply;
      };
      if (existing) return replay(existing);
      const createdAt = now(), deadlineAt = createdAt + jobTimeoutMs, leaseToken = randomId();
      if (!await acquireLease({ ownerKey: key.ownerKey, token: leaseToken, now: createdAt, leaseUntil: deadlineAt })) {
        const concurrent = await getJob(key);
        if (concurrent) return replay(concurrent);
        return { statusCode: 429, body: { error: 'Another review is being processed. Check its status before submitting again.' } };
      }
      const job = { ...key, owner: { subject: owner.subject, email: owner.email.trim().toLowerCase(), isAdmin: owner.isAdmin === true },
        fingerprint, leaseToken, status: 'pending', createdAt, deadlineAt, expiresAt: Math.ceil((createdAt + ttlMs) / 1000) };
      // Unknown insertion/claim outcomes propagate to the caller, which must not ACK
      // or retry execution. The bounded lease remains held; poll reconciles state.
      if (!await putJob(job)) {
        await release(job);
        const winner = await getJob(key);
        if (!winner) throw new Error('Receipt conflict without a readable receipt');
        return replay(winner);
      }
      const claimed = await claimJob({ ...key, now: now() });
      if (!claimed) return replay(await getJob(key) || job);
      emitSafe(emit, { type: 'ack', ...response(claimed).body });
      let settled;
      try {
        if (now() >= claimed.deadlineAt) settled = { job: await expire(claimed), durable: true };
        else {
          const result = await execute(claimed, payload);
          if (now() >= claimed.deadlineAt) settled = { job: await expire(claimed), durable: true };
          else if (await completeJob({ ...key, expectedStatus: 'model_started', patch: { status: 'completed', result, finishedAt: now() } })) {
            await release(claimed); settled = { job: { ...claimed, status: 'completed', result }, durable: true };
          } else settled = await settleUnknown(claimed);
        }
      } catch { settled = await settleUnknown(claimed); }
      const reply = response(settled.job);
      // Never emit a final result claiming persistence when the store is unavailable.
      if (settled.durable) emitSafe(emit, { type: 'result', ...reply.body });
      else { reply.statusCode = 503; reply.body.status = 'indeterminate'; }
      return reply;
    },
  };
}
