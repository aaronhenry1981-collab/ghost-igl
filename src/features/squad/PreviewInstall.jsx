import { useEffect, useRef, useState } from 'react'
export default function PreviewInstall() {
  const dialog = useRef(null), prompt = useRef(null), update = useRef(null)
  const [status, setStatus] = useState('Web preview · local demo'), [updateReady, setUpdateReady] = useState(false)
  useEffect(() => {
    const install = event => { event.preventDefault(); prompt.current = event }
    const installed = () => setStatus('Installed preview window · local demo')
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installed)
    const base = import.meta.env.BASE_URL
    let live = true
    const cleanup = []
    if (import.meta.env.PROD && base === '/squad-preview/' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${base}sw.js`, { scope: base, type: 'module', updateViaCache: 'none' }).then(registration => {
        if (!live) return
        setStatus('Preparing the public preview shell for offline viewing')
        const observed = new WeakSet()
        const changed = () => {
          if (!live) return
          if (registration.active?.state === 'activated') setStatus('Public preview shell available for offline viewing')
          if (registration.waiting) { update.current = registration.waiting; setUpdateReady(true) }
          const worker = registration.installing
          if (worker && !observed.has(worker)) {
            observed.add(worker); worker.addEventListener('statechange', changed)
            cleanup.push(() => worker.removeEventListener('statechange', changed))
          }
          if (worker?.state === 'redundant' && !registration.active) setStatus('Offline preparation failed — keep this page online')
        }
        changed(); registration.addEventListener('updatefound', changed); cleanup.push(() => registration.removeEventListener('updatefound', changed))
      }).catch(() => { if (live) setStatus('Offline preparation unavailable · keep this page online') })
    }
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) installed()
    return () => { live = false; cleanup.forEach(dispose => dispose()); window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installed) }
  }, [])
  async function install() {
    if (prompt.current) {
      const event = prompt.current; prompt.current = null
      try { await event.prompt(); await event.userChoice } catch { dialog.current.showModal() }
    } else dialog.current.showModal()
  }
  return <section className="sq-install" aria-label="Preview installation">
    <span>{status}</span><div className="sq-actions"><button onClick={install}>Install options</button>{updateReady && <button onClick={() => { update.current?.postMessage('ACTIVATE_PREVIEW_UPDATE'); setStatus('Update requested. Reload when ready.'); setUpdateReady(false) }}>Prepare update</button>}</div>
    <dialog ref={dialog}><h2>Install the preview</h2><p>This is a local demonstration, not a connected squad service.</p>{['127.0.0.1', 'localhost'].includes(location.hostname) && <p><strong>This address works only on this computer.</strong> Phone installation needs the separately published HTTPS preview URL. It is not published yet.</p>}<p>On iPhone or iPad, open the published address in Safari, choose Share, then Add to Home Screen.</p><p>On Android, open it in Chrome and choose Install app or Add to Home screen from the browser menu if offered.</p><p>Installation and background audio still need real-device acceptance. Text and diagrams remain usable without audio.</p><button onClick={() => dialog.current.close()}>Close install options</button></dialog>
  </section>
}
