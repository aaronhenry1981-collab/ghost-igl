import { createPlayerDataProvider } from './core.mjs'

export const PROVIDER_CATALOG = Object.freeze({
  ubisoft: {
    id: 'ubisoft',
    label: 'Ubisoft',
    kind: 'official_external',
    status: 'access_required',
    preferred_for: ['identity', 'rank', 'season_stats'],
    credentials_accepted: false,
  },
  trn: {
    id: 'trn',
    label: 'Tracker Network',
    kind: 'approved_external',
    status: 'partnership_or_api_access_required',
    preferred_for: ['bootstrap', 'rank', 'season_stats'],
    credentials_accepted: false,
  },
  psn: {
    id: 'psn',
    label: 'PlayStation Network',
    kind: 'platform_identity',
    status: 'authorized_access_required',
    preferred_for: ['identity'],
    credentials_accepted: false,
  },
  xbox: {
    id: 'xbox',
    label: 'Xbox Network',
    kind: 'platform_identity',
    status: 'authorized_access_required',
    preferred_for: ['identity'],
    credentials_accepted: false,
  },
  replay: {
    id: 'replay',
    label: 'Siege Replay Parser',
    kind: 'recon_ingestion',
    status: 'adapter_ready',
    preferred_for: ['match_events', 'gameplay_metrics'],
    credentials_accepted: false,
  },
  vod: {
    id: 'vod',
    label: 'Recon VOD Analysis',
    kind: 'recon_ingestion',
    status: 'adapter_ready',
    preferred_for: ['behavior', 'coaching_observations'],
    credentials_accepted: false,
  },
  desktop: {
    id: 'desktop',
    label: 'Recon Desktop',
    kind: 'recon_ingestion',
    status: 'adapter_ready',
    preferred_for: ['authorized_client_observations'],
    credentials_accepted: false,
  },
  coach: {
    id: 'coach',
    label: 'Recon Coach',
    kind: 'recon_ingestion',
    status: 'adapter_ready',
    preferred_for: ['coaching_observations'],
    credentials_accepted: false,
  },
  manual: {
    id: 'manual',
    label: 'Player Input',
    kind: 'user_input',
    status: 'available',
    preferred_for: ['fallback'],
    credentials_accepted: false,
  },
})

export function listProviderDescriptors() {
  return Object.values(PROVIDER_CATALOG).map((provider) => ({ ...provider }))
}

export function providerDescriptor(providerId) {
  const provider = PROVIDER_CATALOG[String(providerId || '').toLowerCase()]
  return provider ? { ...provider } : null
}

// Adapters are deliberately injected instead of importing a vendor SDK here.
// That keeps Ubisoft/TRN/platform access replaceable and prevents the rest of
// Recon from depending on one provider's transport or auth model.
export function registerProviderAdapter(providerId, implementation) {
  return createPlayerDataProvider(providerId, implementation)
}
