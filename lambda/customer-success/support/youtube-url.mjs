// Parse only. Never fetch, embed, download or follow a submitted URL.
export function normalizeYoutubeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value.trim())) throw new Error('Enter a valid HTTPS YouTube video link.')
  let url
  try { url = new URL(value.trim()) } catch { throw new Error('Enter a valid HTTPS YouTube video link.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Use an HTTPS YouTube video link without login details or a port.')
  const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])
  if (!hosts.has(url.hostname)) throw new Error('Use a youtube.com or youtu.be video link.')
  let id
  if (url.hostname === 'youtu.be') id = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1]
  else if (url.pathname === '/watch' && url.searchParams.getAll('v').length === 1) id = url.searchParams.get('v')
  else id = /^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1]
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) throw new Error('Use a link to one YouTube video, not a channel or playlist.')
  // Strip tracking, timestamps and arbitrary query/fragment data before storage.
  return { videoId: id, url: `https://www.youtube.com/watch?v=${id}` }
}
