export default function RoleCard({ role, operator, locked, verified = true, ready, disabled, onReady, audio }) {
  return <section className="sq-card sq-role" aria-labelledby="role-title"><p className="sq-eyebrow">YOUR PERSONAL CARD</p><h2 id="role-title">{role?.name || 'Waiting for your assignment'}</h2>{role ? <>
    <p className="sq-role-operator">{operator} · {locked ? verified ? 'Current locked plan' : 'Cached plan — verify before using' : 'Draft role'}</p>
    <div className="sq-audio"><p>Local voice, if available. Your device output only; no automatic PS5 or Discord routing.</p>
      {!audio.enabled ? <button disabled={!locked || !verified} onClick={audio.enable}>Enable local audio</button> : <div className="sq-actions"><button className="sq-primary" disabled={!locked || !verified} onClick={audio.read}>Read My Role / Replay</button><button onClick={audio.stop}>Stop</button><button onClick={audio.mute}>Mute</button></div>}
      <p role="status">{audio.status}</p>
    </div>
    <ol className="sq-steps"><li><span>First action</span>{role.first}</li><li><span>Commit cue</span>{role.cue}</li><li><span>Fallback</span>{role.fallback}</li></ol>
    <button className="sq-primary sq-ready" disabled={disabled || !locked || !verified || ready} onClick={onReady}>{ready ? 'Ready acknowledged' : 'I’m ready for this plan'}</button>
    <details className="sq-diagram-details"><summary>Show demonstration diagram</summary><div className="sq-schematic" role="img" aria-label="Demonstration sequence: start, check, regroup. This is not a map or tactical route."><span>1<br />Start</span><b>→</b><span>2<br />Check</span><b>→</b><span>3<br />Regroup</span></div><p className="sq-caption">Demonstration schematic, not a Siege floor plan. No licensed instructional clip is attached.</p></details>
  </> : <p>Join the squad, report your operator, then ask the IGL to assign you. Late joins receive the current round without resetting it.</p>}</section>
}
