import { Link } from 'react-router-dom'
import { categoryLabel, SEVERITY_LABEL, teamLabel } from '../supportLogic.mjs'
import { FactTag, InferenceTag } from '../ui/bits'

function Kind({ item }) {
  return item?.kind === 'inference' ? <InferenceTag confidence={item.confidence} /> : <FactTag />
}

// Support Copilot (§8), deterministic. Output items are tagged `kind:
// 'fact' | 'inference'`: { model, summary, playerContext[], category,
// severity, likelyRootCause, recentChanges[], related {cases, incidents},
// suggestedSteps[], draftReply {text, guard}, helpArticles[],
// suggestedEscalation, disclaimers[], advisoryOnly }. Suggestions only: it
// never sends and never changes state. "Insert into reply" copies the draft
// into the public composer for a person to edit and send.
export default function Copilot({ data, onInsert, onEscalate, articleHref }) {
  if (!data || data.status === 'not_available' || data.status === 'error') return <p className="sp-muted">Copilot has nothing for this case yet.</p>
  const steps = data.suggestedSteps || []
  const related = data.related || {}
  return (
    <div className="sc-copilot">
      <p className="sc-copilot-note">Suggestions only · nothing is sent automatically · {data.model === 'deterministic' ? 'rules, no model' : 'model-assisted'}</p>
      {data.summary?.text && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Summary <Kind item={data.summary} /></p>
          <p>{data.summary.text}</p>
        </div>
      )}
      <div className="sp-row sp-small">
        {data.category?.value && <span>Category: <strong>{data.category.label || categoryLabel(data.category.value)}</strong>{data.category.suggested && data.category.suggested.value !== data.category.value && <span className="sp-muted"> (classifier suggests {categoryLabel(data.category.suggested.value)})</span>}</span>}
        {data.severity?.value && <span>Severity: <strong>{SEVERITY_LABEL[data.severity.value] || data.severity.value}</strong></span>}
      </div>
      {(data.playerContext || []).length > 0 && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Player context</p>
          <ul className="sc-mini">{data.playerContext.map((f, i) => <li key={i}><span className="sc-wrap">{f.text}</span> <Kind item={f} /></li>)}</ul>
        </div>
      )}
      {data.likelyRootCause?.text && (
        <div className="sc-cp-block sc-cp-root">
          <p className="sc-subhead">Likely root cause <InferenceTag confidence={data.likelyRootCause.confidence} /></p>
          <p>{data.likelyRootCause.text}</p>
          {data.likelyRootCause.basis && <p className="sp-muted sp-small">Basis: {data.likelyRootCause.basis}</p>}
        </div>
      )}
      {steps.length > 0 && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Suggested steps</p>
          <ol className="sc-steps">
            {steps.map((s, i) => <li key={i}><span>{s.text}</span> <Kind item={s} />{s.requiresActionRequest && <span className="sp-muted sp-small"> · needs an action request</span>}</li>)}
          </ol>
        </div>
      )}
      {data.draftReply?.text && (
        <div className="sc-cp-block sc-cp-draft">
          <p className="sc-subhead">Draft reply {data.draftReply.guard?.ok === false && <span className="sp-muted sp-small">(copy guard replaced the template)</span>}</p>
          <blockquote className="sc-draft-text">{data.draftReply.text}</blockquote>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onInsert?.(data.draftReply.text)}>Insert into reply</button>
        </div>
      )}
      {(data.helpArticles || []).length > 0 && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Help to share</p>
          <ul className="sc-mini">
            {data.helpArticles.map((a) => <li key={a.slug}>{articleHref ? <Link to={articleHref(a.slug)} className="sc-link">{a.title}</Link> : a.title}</li>)}
          </ul>
        </div>
      )}
      {((related.cases || []).length > 0 || (related.incidents || []).length > 0) && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Related</p>
          <ul className="sc-mini">
            {(related.cases || []).map((c, i) => <li key={`c${i}`}><span className="sc-wrap">{c.text}</span></li>)}
            {(related.incidents || []).map((inc, i) => <li key={`i${i}`}><span className="sc-wrap">{inc.text}</span></li>)}
          </ul>
        </div>
      )}
      {(data.recentChanges || []).length > 0 && (
        <div className="sc-cp-block">
          <p className="sc-subhead">Recent changes</p>
          <ul className="sc-mini">{data.recentChanges.slice(0, 6).map((f, i) => <li key={i}><span className="sc-wrap">{f.text}</span></li>)}</ul>
        </div>
      )}
      {data.suggestedEscalation && (
        <div className="sc-cp-block sc-cp-esc">
          <p className="sc-subhead">Escalation suggestion <InferenceTag /></p>
          <p>To <strong>{teamLabel(data.suggestedEscalation.team)}</strong>: {data.suggestedEscalation.reason}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEscalate?.(data.suggestedEscalation)}>Review hand-off</button>
        </div>
      )}
      {(data.disclaimers || []).length > 0 && <p className="sp-muted sp-small">{data.disclaimers.join(' ')}</p>}
    </div>
  )
}
