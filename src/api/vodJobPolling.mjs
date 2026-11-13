// Polling is read-only. A lost admission receipt must never trigger another POST.
export const JOB_POLL_BUDGET_MS = 240000
export function jobPending(message = 'Your review may still be processing. Check its status without submitting another review.') {
  return Object.assign(new Error(message), {code:'review_pending'})
}
export async function pollVodJob({jobId,fetchStatus,isCurrent=()=>true,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),budgetMs=JOB_POLL_BUDGET_MS}) {
  const until=now()+budgetMs
  while(now()<until) {
    if(!isCurrent()) throw Object.assign(new Error('Review status check stopped after account or page changed.'),{code:'review_cancelled'})
    let response
    try { response=await fetchStatus(jobId) } catch(error) {
      if(error.code==='not_authenticated'||error.code==='review_cancelled') throw error
      await sleep(2000); continue
    }
    if(!isCurrent()) throw Object.assign(new Error('Review status check stopped.'),{code:'review_cancelled'})
    if(response.status===401||response.status===403) throw Object.assign(new Error('Sign in to the account that submitted this review to check its status.'),{code:'not_authenticated'})
    if(response.status===404) throw jobPending('The review receipt is not available yet. Check status later; do not submit another paid review.')
    if(!response.ok) {await sleep(2000);continue}
    const receipt=await response.json()
    if(receipt.status==='completed' && receipt.result) {
      const result=receipt.result
      return {ok:result.statusCode>=200&&result.statusCode<300,status:result.statusCode,json:async()=>typeof result.body==='string'?JSON.parse(result.body):result.body}
    }
    if(['failed','indeterminate'].includes(receipt.status)) throw Object.assign(new Error('This review could not be completed. No automatic retry was made; allowance may have been used.'),{code:'review_failed'})
    if(!['pending','running','model_started'].includes(receipt.status)) throw jobPending()
    await sleep(2000)
  }
  throw jobPending('Review status checking paused. Check status again without starting another review.')
}
export function pendingJobKey(subject) { return `recon-vod-job:${subject}` }
export function readPendingJob(subject,storage=globalThis.sessionStorage) {
  try {const value=JSON.parse(storage?.getItem(pendingJobKey(subject))||'null');return value?.subject===subject&&value.jobId?value:null}catch{return null}
}
export function savePendingJob(job,storage=globalThis.sessionStorage) {
  try { if (!storage) return false; storage.setItem(pendingJobKey(job.subject),JSON.stringify(job)); return storage.getItem(pendingJobKey(job.subject)) === JSON.stringify(job) } catch { return false }
}
export function clearPendingJob(subject,storage=globalThis.sessionStorage) {try{storage?.removeItem(pendingJobKey(subject))}catch{}}
