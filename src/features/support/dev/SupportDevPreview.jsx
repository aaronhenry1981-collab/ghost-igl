import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import CrmPage from '../../crm/CrmPage'
import { createDevCrmApi } from '../../dev/devClient'
import { createSupportClient } from '../supportApi'
import { supportPaths } from '../supportPaths'
import { createFixtureTransport } from '../fixtures/transport'
import SupportPage from '../player/SupportPage'
import HelpCenter from '../help/HelpCenter'
import { SUPPORT_DEV_LINKS, transportScenario, TRIAGE_SAMPLE } from './devScenarios'

// DEV ONLY (the /__dev route and this chunk never ship in production).
// Real support screens over the in-memory fixture transport: fictional data,
// nothing leaves the browser tab.

function Banner({ as, what }) {
  return <p className="dev-preview-banner">Dev preview · {what} · fictional data · scenario <strong>{as}</strong> · nothing is sent</p>
}

function useFixtureClient(as) {
  return useMemo(() => createSupportClient(createFixtureTransport({ scenario: transportScenario(as) })), [as])
}

export function DevSupportPlayer({ rest, as }) {
  const client = useFixtureClient(as)
  const keep = as === 'default' ? {} : { as }
  const paths = useMemo(() => supportPaths({ base: '/__dev', keep }), [as]) // eslint-disable-line react-hooks/exhaustive-deps
  const caseNumber = rest[0] === 'cases' && rest[1] ? decodeURIComponent(rest[1]) : null
  return (
    <SupportPage
      key={`${as}-${caseNumber || ''}`}
      api={client}
      paths={paths}
      signedIn={as !== 'signed_out'}
      caseNumber={caseNumber}
      initialText={as === 'triage' ? TRIAGE_SAMPLE : ''}
      initialTab={as === 'resolved' ? 'resolved' : as === 'waiting_on_me' ? 'waiting_on_me' : null}
      banner={<Banner as={as} what="Player Command" />}
    />
  )
}

export function DevHelp({ slug, as }) {
  const client = useFixtureClient(as)
  const keep = as === 'default' ? {} : { as }
  const paths = useMemo(() => supportPaths({ base: '/__dev', keep }), [as]) // eslint-disable-line react-hooks/exhaustive-deps
  return <HelpCenter key={as} api={client} paths={paths} slug={slug || null} banner={<Banner as={as} what="Help Center (DRAFT articles)" />} />
}

export function DevSupportStaff({ rest, as }) {
  const api = useMemo(() => ({ ...createDevCrmApi(), support: createSupportClient(createFixtureTransport({ scenario: transportScenario(as) })) }), [as])
  const keep = as === 'default' ? null : { as }
  return (
    <>
      <Banner as={as} what="Support Command Center" />
      <CrmPage key={as} api={api} basePath="/__dev/crm" tab="support" support={{ path: rest, keep }} preview />
    </>
  )
}

export function SupportDevIndex() {
  const groups = [...new Set(SUPPORT_DEV_LINKS.map((l) => l.group))]
  return (
    <>
      {groups.map((g) => (
        <section key={g}>
          <h2>Support · {g}</h2>
          <ul>
            {SUPPORT_DEV_LINKS.filter((l) => l.group === g).map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        </section>
      ))}
    </>
  )
}
