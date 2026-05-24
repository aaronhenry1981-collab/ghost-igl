import MAPS from './maps.mjs'

const app = document.getElementById('app')
let state = {
  view: 'strats',
  license: null,
  selectedMapId: MAPS[0].id,
  subStatus: null,
  error: null,
  busy: false,
  tokenInput: '',
}

async function init() {
  const res = await window.igl.loadLicense()
  if (res.valid) {
    state.license = res.payload
    await refreshStatus()
  }
  render()
}

async function refreshStatus() {
  // Stub for future backend verification — v0.1 trusts the local token.
  state.subStatus = state.license ? 'active' : 'none'
}

function setState(patch) {
  state = { ...state, ...patch }
  render()
}

async function activate() {
  if (!state.tokenInput.trim()) return
  setState({ busy: true, error: null })
  const res = await window.igl.activateLicense(state.tokenInput.trim())
  if (res.ok) {
    setState({ license: res.payload, tokenInput: '', busy: false, error: null, subStatus: 'active' })
  } else {
    setState({ busy: false, error: res.error })
  }
}

async function signOut() {
  await window.igl.clearLicense()
  setState({ license: null, subStatus: null, view: 'strats' })
}

function render() {
  app.innerHTML = ''
  if (!state.license) {
    app.appendChild(renderActivation())
    return
  }
  app.appendChild(renderSidebar())
  app.appendChild(renderMain())
}

function renderActivation() {
  const el = document.createElement('div')
  el.style.gridColumn = '1 / -1'
  el.innerHTML = `
    <div class="activate-box">
      <h1>Activate IGL Command</h1>
      <p>Paste the activation token from your Champion account. Generate one at <a href="#" id="open-activate">r6coaching.com/#/activate</a>.</p>
      <textarea id="token" placeholder="Paste activation token here…"></textarea>
      ${state.error ? `<div class="note error">${escapeHtml(state.error)}</div>` : ''}
      <div class="row">
        <button class="btn" id="activate-btn"${state.busy ? ' disabled' : ''}>${state.busy ? 'Activating…' : 'Activate'}</button>
        <button class="btn ghost" id="open-site">Open r6coaching.com</button>
      </div>
      <p style="margin-top:1.25rem;font-size:0.8rem;">Need help? Email <a href="#" id="mailto-link">aaronhenry1981@gmail.com</a>.</p>
    </div>
  `
  el.querySelector('#token').addEventListener('input', (e) => { state.tokenInput = e.target.value })
  el.querySelector('#activate-btn').addEventListener('click', activate)
  el.querySelector('#open-activate').addEventListener('click', (e) => { e.preventDefault(); window.igl.openExternal('https://r6coaching.com/#/activate') })
  el.querySelector('#open-site').addEventListener('click', () => window.igl.openExternal('https://r6coaching.com'))
  el.querySelector('#mailto-link').addEventListener('click', (e) => { e.preventDefault(); window.igl.openExternal('mailto:aaronhenry1981@gmail.com?subject=IGL%20Command%20Help') })
  return el
}

function renderSidebar() {
  const el = document.createElement('div')
  el.className = 'sidebar'
  const plan = state.license?.plan || 'free'
  el.innerHTML = `
    <div class="sidebar-brand">GHOST <span>IGL</span></div>
    <div class="nav-item${state.view === 'overview' ? ' active' : ''}" data-view="overview">Overview</div>
    <div class="nav-item${state.view === 'strats' ? ' active' : ''}" data-view="strats">Map Strats</div>
    <div class="nav-item${state.view === 'live' ? ' active' : ''}" data-view="live">Live Coaching</div>
    <div class="nav-item${state.view === 'settings' ? ' active' : ''}" data-view="settings">Settings</div>
    <div class="sidebar-footer">
      <div class="badge champion">${escapeHtml(plan.toUpperCase())}</div><br/>
      <div style="margin-top:0.5rem;word-break:break-all;">${escapeHtml(state.license?.email || '')}</div>
      <div style="margin-top:0.5rem;">v0.1.0</div>
    </div>
  `
  el.querySelectorAll('.nav-item').forEach((n) => {
    n.addEventListener('click', () => setState({ view: n.dataset.view }))
  })
  return el
}

function renderMain() {
  const el = document.createElement('div')
  el.className = 'main'
  if (state.view === 'overview') el.appendChild(viewOverview())
  else if (state.view === 'strats') el.appendChild(viewStrats())
  else if (state.view === 'live') el.appendChild(viewLive())
  else if (state.view === 'settings') el.appendChild(viewSettings())
  return el
}

function viewOverview() {
  const el = document.createElement('div')
  const rankedCount = MAPS.filter((m) => m.rankedPool).length
  el.innerHTML = `
    <h1>Welcome, IGL</h1>
    <p>Your Champion license is active. Browse map strats offline and get ready for live in-match coaching.</p>
    <div class="stat-row">
      <div class="stat"><div class="stat-label">Status</div><div class="stat-value">Active</div></div>
      <div class="stat"><div class="stat-label">Plan</div><div class="stat-value">${escapeHtml(state.license.plan || 'champion')}</div></div>
      <div class="stat"><div class="stat-label">Maps</div><div class="stat-value">${MAPS.length}</div></div>
      <div class="stat"><div class="stat-label">Ranked rotation</div><div class="stat-value">${rankedCount}</div></div>
    </div>
    <div class="card">
      <h2>What's here in v0.1</h2>
      <p>• Offline map + bomb site browser (26 maps)<br/>• License activation tied to your r6coaching.com account<br/>• Settings to manage your license</p>
      <h2 style="margin-top:1rem;">Coming in the next update</h2>
      <p>• Live capture-based coaching (PC + console feed)<br/>• TTS voice callouts during play<br/>• Real-time 5-stack team sessions<br/>• VOD timeline tagging</p>
    </div>
  `
  return el
}

function viewStrats() {
  const el = document.createElement('div')
  el.innerHTML = `
    <h1>Map Strats</h1>
    <div class="strat-layout">
      <div class="strat-sidebar" id="map-list"></div>
      <div class="strat-detail" id="map-detail"></div>
    </div>
  `
  const mapList = el.querySelector('#map-list')
  MAPS.forEach((m) => {
    const d = document.createElement('div')
    d.className = 'strat-map' + (m.id === state.selectedMapId ? ' active' : '')
    d.innerHTML = `${escapeHtml(m.name)}${m.rankedPool ? '<small>RANKED</small>' : ''}`
    d.addEventListener('click', () => setState({ selectedMapId: m.id }))
    mapList.appendChild(d)
  })
  el.querySelector('#map-detail').appendChild(renderMapDetail())
  return el
}

function renderMapDetail() {
  const map = MAPS.find((m) => m.id === state.selectedMapId) || MAPS[0]
  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <h2>${escapeHtml(map.name)}${map.rankedPool ? ' <span class="badge champion">Ranked pool</span>' : ''}</h2>
    <div class="site-list">
      ${map.sites.map((s) => `
        <div class="site-item">
          <span class="site-floor">${escapeHtml(s.floor)}</span>${escapeHtml(s.name)}
        </div>
      `).join('')}
    </div>
    <p style="margin-top:1.5rem;font-size:0.8rem;">Full operator picks, utility plans, and drone paths will land with the next update — they currently live on r6coaching.com/#/strats.</p>
  `
  return wrap
}

function viewLive() {
  const el = document.createElement('div')
  el.innerHTML = `
    <h1>Live Coaching <span class="badge coming-soon">Coming in v0.2</span></h1>
    <div class="card">
      <p>Live coaching reads your game feed (PC screen or capture card) and calls out intel as rounds unfold. Planned for the next update.</p>
      <h3>What it'll do</h3>
      <p>• Auto-detect map, side, and operator picks<br/>• Voice callouts during prep and action phases<br/>• Utility reminders (flashes, breach charges, gadgets left)<br/>• Flank watch from observed peeks</p>
      <h3>What we need from you before launch</h3>
      <p>• Your capture setup (OBS / Elgato model)<br/>• Preferred voice (male/female, pacing)<br/>• Beta slots: email aaronhenry1981@gmail.com to join</p>
    </div>
  `
  return el
}

function viewSettings() {
  const el = document.createElement('div')
  el.innerHTML = `
    <h1>Settings</h1>
    <div class="card">
      <h2>License</h2>
      <p>Signed in as <strong>${escapeHtml(state.license?.email || '')}</strong></p>
      <p>Plan: <span class="badge champion">${escapeHtml(state.license?.plan || 'champion')}</span></p>
      <div class="row">
        <button class="btn ghost" id="open-site">Manage billing on r6coaching.com</button>
        <button class="btn danger" id="sign-out">Sign out</button>
      </div>
    </div>
    <div class="card">
      <h2>About</h2>
      <p>IGL Command v0.1.0 — Champion-tier companion for Ghost IGL.</p>
      <p>Issues? Email <a href="#" id="mailto">aaronhenry1981@gmail.com</a>.</p>
    </div>
  `
  el.querySelector('#open-site').addEventListener('click', () => window.igl.openExternal('https://r6coaching.com/#/account'))
  el.querySelector('#sign-out').addEventListener('click', signOut)
  el.querySelector('#mailto').addEventListener('click', (e) => { e.preventDefault(); window.igl.openExternal('mailto:aaronhenry1981@gmail.com?subject=IGL%20Command') })
  return el
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

init()
