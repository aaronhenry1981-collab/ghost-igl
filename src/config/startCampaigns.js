// Campaign-specific touches for /start, keyed by utm_campaign. One page
// serves every video: to make a variant, add an entry here instead of a new
// landing page. Only the eyebrow line and the round plan the demo opens on can
// change; the promise, proof, pricing and objections stay the same for every
// visitor so public pages never disagree.
//
//   <campaign key>: {
//     eyebrow: 'Short line that continues the video',
//     demo: { mapId, siteId, side },   // free maps only (see lib/startDemo.js)
//   }
//
// Example (not live until a video links to it):
//   coastline_hookah: {
//     eyebrow: 'From the Coastline Hookah video',
//     demo: { mapId: 'coastline', siteId: 'hookah-billiards', side: 'attack' },
//   },
export const START_CAMPAIGNS = Object.freeze({})

export function startCampaign(utmCampaign, campaigns = START_CAMPAIGNS) {
  const key = String(utmCampaign || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
  return (key && Object.prototype.hasOwnProperty.call(campaigns, key)) ? campaigns[key] : null
}
