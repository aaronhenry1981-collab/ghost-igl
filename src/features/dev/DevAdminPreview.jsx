import { useMemo } from 'react'
import AdminApp from '../admin/AdminApp'
import { createSupportClient } from '../support/supportApi'
import { createFixtureTransport } from '../support/fixtures/transport'
import { createDevCrmApi } from './devClient'
import { installAdminFixtures } from './adminFixtures'

// DEV ONLY (see main.jsx): the real admin application over fictional data.
// Member, billing, coaching and content calls are answered in the browser by
// adminFixtures.js; customer-success screens use the local cs dev server
// (node scripts/cs-dev-server.mjs) and the Support fixture transport.
installAdminFixtures()

export default function DevAdminPreview() {
  const crmApi = useMemo(() => ({ ...createDevCrmApi(), support: createSupportClient(createFixtureTransport({ scenario: 'default' })) }), [])
  return <AdminApp base="/__dev/admin" viewer={{ email: 'owner@example.test' }} preview crmApi={crmApi} />
}
