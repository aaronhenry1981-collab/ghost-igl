import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { groupBySection, isReviewed, parseArticleBody, sectionById, sectionForCategory } from '../helpText.mjs'
import { errorMessage, isNotEnabled } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Breadcrumb, EmptyState, Highlight, RoundInterrupted, Skeleton } from '../ui/bits'
import '../support.css'

const SUPPORT_EMAIL = 'support@r6coaching.com'

// /help and /help/:slug. Articles come from the API, which serves reviewed
// articles only: GET /cs/help/articles?q= -> { q, articles: [{ slug, title,
// summary, category, status }], status }, and /cs/help/articles/{slug} ->
// the article { slug, title, category, summary, keywords, body, status,
// reviewedBy, sources }. Drafts appear only in the dev preview (the backend
// marks those responses `preview: true`) and always carry a DRAFT badge.
export default function HelpCenter({ api, paths, slug = null, banner = null }) {
  return (
    <div className="sp sp-help">
      {banner}
      {slug ? <Article key={slug} api={api} slug={slug} paths={paths} /> : <HelpHome api={api} paths={paths} />}
    </div>
  )
}

function DraftBadge({ article }) {
  if (isReviewed(article)) return null
  return <span className="sp-draft-badge" title="Not reviewed yet. Production only serves reviewed articles.">DRAFT: pending review</span>
}

function HelpHome({ api, paths }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const section = sectionById(params.get('section'))?.id || null
  const [input, setInput] = useState(q)
  const inputId = useId()
  const res = useSupportResource(api, 'listArticles', q)

  // Debounce the URL update so typing doesn't spam the API.
  useEffect(() => {
    if (input.trim() === q) return undefined
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (input.trim()) next.set('q', input.trim())
        else next.delete('q')
        next.delete('section')
        return next
      }, { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [input, q, setParams])

  const items = res.data?.articles || []
  const notLive = !api || (res.status === 'error' && isNotEnabled(res.error))
  const reviewing = notLive || (res.status === 'ready' && !q && items.length === 0)
  const grouped = groupBySection(items)
  const shown = section ? grouped.sections.filter((s) => s.id === section) : grouped.sections

  return (
    <>
      <header className="sp-hero sp-hero-help">
        <p className="sp-eyebrow">Help Center · field manual</p>
        <h1 className="sp-h1">Fix it fast</h1>
        <form className="sp-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={inputId} className="sp-visually-hidden">Search help</label>
          <span className="sp-search-icon" aria-hidden="true">⌕</span>
          <input id={inputId} type="search" className="sp-search-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask it like a question: why is my rank wrong?" autoComplete="off" />
        </form>
        <p className="sp-visually-hidden" aria-live="polite">{q && res.status === 'ready' ? `${items.length} article${items.length === 1 ? '' : 's'} for ${q}` : ''}</p>
      </header>

      {res.status === 'loading' && api && <Skeleton lines={4} label="Loading articles…" />}
      {res.status === 'error' && !notLive && <RoundInterrupted message={errorMessage(res.error, "Couldn't load help articles.")} onRetry={res.reload} />}

      {reviewing && (
        <section className="sp-panel sp-reviewing">
          <p className="sp-hud-label">Articles in review</p>
          <h2 className="sp-h2">We&apos;re checking every article before it goes up</h2>
          <p className="sp-muted">No guesswork answers here: each one is reviewed against how Recon actually works. Meanwhile, ask us directly.</p>
          <div className="sp-row">
            <Link to={paths.support()} className="btn btn-primary btn-sm">Ask for help</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-ghost btn-sm">Email support</a>
          </div>
        </section>
      )}

      {res.status === 'ready' && q && (
        <section className="sp-panel" aria-label="Search results">
          <p className="sp-hud-label">{items.length ? `${items.length} match${items.length === 1 ? '' : 'es'}` : 'No match'}</p>
          {items.length ? (
            <ul className="sp-results">
              {items.map((a) => (
                <li key={a.slug}>
                  <Link to={paths.article(a.slug)} className="sp-result">
                    <span className="sp-result-title"><Highlight text={a.title} query={q} /></span>
                    <span className="sp-result-summary"><Highlight text={a.summary} query={q} /></span>
                    <span className="sp-result-meta">{sectionForCategory(a.category)?.title || 'General'}<DraftBadge article={a} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={`Nothing for “${q}” yet`} action={<Link to={paths.support()} className="btn btn-primary btn-sm">Ask Recon instead</Link>}>
              Try fewer words, or open a case and we&apos;ll answer it directly.
            </EmptyState>
          )}
        </section>
      )}

      {res.status === 'ready' && !q && items.length > 0 && (
        <>
          {section && (
            <p className="sp-filterline">
              Showing <strong>{sectionById(section).title}</strong> · <Link to={paths.help()}>All sections</Link>
            </p>
          )}
          <div className="sp-sections">
            {shown.map((s) => (
              <section key={s.id} className="sp-section-card" aria-labelledby={`help-sec-${s.id}`}>
                <h2 id={`help-sec-${s.id}`} className="sp-section-title">{s.title}</h2>
                <p className="sp-muted sp-small">{s.blurb}</p>
                {s.articles.length ? (
                  <ul className="sp-section-list">
                    {s.articles.map((a) => (
                      <li key={a.slug}>
                        <Link to={paths.article(a.slug)}>{a.title}</Link>
                        <DraftBadge article={a} />
                      </li>
                    ))}
                  </ul>
                ) : <p className="sp-muted sp-small">Articles for this are in review.</p>}
                <Link to={paths.support({ category: s.category, from: `help:${s.id}` })} className="sp-section-ask">Ask about {s.title.toLowerCase()} →</Link>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function Inline({ tokens, paths }) {
  return tokens.map((t, i) => {
    if (t.type === 'strong') return <strong key={i}>{t.text}</strong>
    if (t.type === 'code') return <code key={i}>{t.text}</code>
    if (t.type === 'link') return <Link key={i} to={paths.internal(t.href)}>{t.text}</Link>
    return <span key={i}>{t.text}</span>
  })
}

function Body({ md, paths }) {
  return parseArticleBody(md).map((b, i) => {
    if (b.type === 'h2') return <h2 key={i} className="sp-art-h2"><Inline tokens={b.inline} paths={paths} /></h2>
    if (b.type === 'h3') return <h3 key={i} className="sp-art-h3"><Inline tokens={b.inline} paths={paths} /></h3>
    if (b.type === 'note') return <p key={i} className="sp-art-note"><Inline tokens={b.inline} paths={paths} /></p>
    if (b.type === 'ul' || b.type === 'ol') {
      const Tag = b.type
      return <Tag key={i} className="sp-art-list">{b.items.map((it, j) => <li key={j}><Inline tokens={it} paths={paths} /></li>)}</Tag>
    }
    return <p key={i}><Inline tokens={b.inline} paths={paths} /></p>
  })
}

function Article({ api, slug, paths }) {
  const res = useSupportResource(api, 'getArticle', slug)
  if (!api) {
    return (
      <>
        <Breadcrumb to={paths.help()}>Help Center</Breadcrumb>
        <EmptyState title="This article is still in review" action={<Link to={paths.support()} className="btn btn-primary btn-sm">Ask for help</Link>}>Ask us directly and we&apos;ll answer it.</EmptyState>
      </>
    )
  }
  if (res.status === 'loading') return <><Breadcrumb to={paths.help()}>Help Center</Breadcrumb><Skeleton lines={6} label="Loading article…" /></>
  if (res.status === 'error') {
    return (
      <>
        <Breadcrumb to={paths.help()}>Help Center</Breadcrumb>
        {res.error?.status === 404 ? (
          <EmptyState title="That article isn't published" action={<Link to={paths.support()} className="btn btn-primary btn-sm">Ask for help</Link>}>It may still be in review. Ask us and we&apos;ll answer directly.</EmptyState>
        ) : <RoundInterrupted message={errorMessage(res.error, "Couldn't load this article.")} onRetry={res.reload} />}
      </>
    )
  }
  if (res.status !== 'ready') return null
  const a = res.data.article || res.data
  const sec = sectionForCategory(a.category)
  return (
    <article className="sp-article">
      <Breadcrumb to={paths.help()}>Help Center</Breadcrumb>
      <header className="sp-article-head">
        <div className="sp-row">
          {sec && <Link to={paths.help({ section: sec.id })} className="sp-chip sp-tone-accent sp-chip-link">{sec.title}</Link>}
          <DraftBadge article={a} />
        </div>
        <h1 className="sp-h1">{a.title}</h1>
        {a.summary && <p className="sp-sub">{a.summary}</p>}
        {(a.updatedAt || a.reviewedBy) && <p className="sp-muted sp-small">{a.updatedAt ? <>Updated <Ago at={a.updatedAt} fallback="—" /></> : null}{a.reviewedBy ? ` · reviewed by ${a.reviewedBy}` : ''}</p>}
      </header>
      <div className="sp-article-body">
        <Body md={a.body || ''} paths={paths} />
      </div>
      {!isReviewed(a) && a.sources?.length > 0 && (
        <p className="sp-muted sp-small">Draft sources for review: {a.sources.join(' · ')}</p>
      )}
      <aside className="sp-article-cta">
        <div>
          <p className="sp-callout-title">Still stuck?</p>
          <p className="sp-muted">Open a case. We already see your account, so it&apos;s one message.</p>
        </div>
        <Link to={paths.support({ category: a.category || sec?.category, from: `help:${a.slug}` })} className="btn btn-primary btn-sm">Open a case</Link>
      </aside>
      {a.related?.length > 0 && (
        <nav className="sp-related" aria-label="Related articles">
          <p className="sp-hud-label">Related</p>
          <ul>{a.related.map((r) => <li key={r.slug}><Link to={paths.article(r.slug)}>{r.title}</Link></li>)}</ul>
        </nav>
      )}
    </article>
  )
}
