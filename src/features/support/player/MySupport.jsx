import { Link } from 'react-router-dom'
import { BUCKETS, bucketCounts, categoryLabel, csatLabel, playerStatusLabel } from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'
import { Ago, Chip, EmptyState, RoundInterrupted, Skeleton } from '../ui/bits'
import { TabPanel, Tabs } from '../ui/Tabs'

const EMPTY_COPY = {
  open: ['Nothing open.', 'New cases show up here the moment you send them.'],
  waiting_on_recon: ['Nothing waiting on us.', 'When Recon is working a case, it sits here.'],
  waiting_on_me: ["You're all caught up.", 'If we need something from you, it lands here first.'],
  resolved: ['Nothing resolved yet.', 'Fixed cases wait here for your thumbs up.'],
  closed: ['No closed cases.', 'Closed cases stay here for reference.'],
}

const BUCKET_TONE = { waiting_on_me: 'warning', open: 'accent', waiting_on_recon: 'info', resolved: 'ok', closed: 'muted' }

export default function MySupport({ state, buckets, tab, onTab, paths }) {
  const counts = bucketCounts(buckets)
  const tabs = BUCKETS.map((b) => ({ ...b, count: counts[b.id], tone: b.id === 'waiting_on_me' && counts[b.id] ? 'alert' : null }))
  const list = buckets?.[tab] || []

  return (
    <div className="sp-mysupport">
      <Tabs
        tabs={tabs}
        value={tab}
        onChange={onTab}
        label="My support cases"
        idBase="sp-buckets"
        className="sp-tabs sp-tabs-buckets"
        renderTab={(t) => (
          <>
            <span className="sp-tab-label">{t.label}</span>
            <span className="sp-tab-count" aria-label={`${t.count} case${t.count === 1 ? '' : 's'}`}>{state.status === 'ready' ? t.count : '–'}</span>
          </>
        )}
      />
      <TabPanel idBase="sp-buckets" activeId={tab} className="sp-bucket-panel">
        {state.status === 'loading' && <Skeleton lines={3} label="Loading your cases…" />}
        {state.status === 'error' && <RoundInterrupted message={errorMessage(state.error, "Couldn't load your cases.")} onRetry={state.reload} />}
        {state.status === 'ready' && (list.length === 0 ? (
          <EmptyState title={EMPTY_COPY[tab][0]}>{EMPTY_COPY[tab][1]}</EmptyState>
        ) : (
          <ul className="sp-cases">
            {list.map((c) => (
              <li key={c.caseNumber}>
                <Link to={paths.caseUrl(c.caseNumber)} className={`sp-case-row sp-bar-${BUCKET_TONE[tab]}`}>
                  <span className="sp-case-top">
                    <span className="sp-case-no">{c.caseNumber}</span>
                    {tab === 'waiting_on_me' ? <Chip tone="warning">Your move</Chip> : <Chip tone={BUCKET_TONE[tab]}>{playerStatusLabel(c.status)}</Chip>}
                    {c.csat?.rating && <Chip tone="muted">{csatLabel(c.csat.rating)}</Chip>}
                  </span>
                  <span className="sp-case-subject">{c.subject}</span>
                  <span className="sp-case-meta">{categoryLabel(c.category)} · updated <Ago at={c.updatedAt} fallback="—" /></span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </TabPanel>
    </div>
  )
}
