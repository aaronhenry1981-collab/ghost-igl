// Display mode never grants identity, hosting access, membership or funding.
// The reserved fragment is not sent to the HTTP server. The service worker
// explicitly maps only this navigation fragment to its versioned public shell.
export const LOCAL_DEMO_HASH = '#local-demo'

export function initialSquadMode({ configured, hash = '' }) {
  return configured && hash !== LOCAL_DEMO_HASH ? 'account' : 'demo'
}

export function squadModePath(location, mode) {
  if (!['account', 'demo'].includes(mode)) throw new Error('Unknown squad display mode')
  const hash = mode === 'demo' ? LOCAL_DEMO_HASH : location.hash === LOCAL_DEMO_HASH ? '' : location.hash || ''
  return `${location.pathname}${location.search || ''}${hash}`
}
