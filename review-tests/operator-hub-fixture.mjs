// Entirely fictional. Never use this object to populate a release package.
export const PUBLIC_TEST_MARKER = 'OPHUB_TEST_FIXTURE_ONLY_ZY7Q2'
const example = 'https://example.invalid/'
export const HUB_FIXTURE = {
  schemaVersion: 1,
  scope: { patch: 'TEST-0', verifiedOn: '2000-01-01', rosterUrl: example, patchUrl: example },
  operators: [
    { slug: 'fictional-citrine', name: 'Fictional Citrine', side: 'attack', role: 'Fixture pathfinder',
      gadget: 'Fixture crystal', when: `${PUBLIC_TEST_MARKER}: Use the made-up pathfinder in the invented trial.`,
      how: 'This text describes only a test case.', teamFit: null, counterplay: null, officialUrl: example, sites: [
        { mapId: 'fixture-map', siteId: 'fixture-site', mapName: 'Fixture map', siteName: 'Fixture site',
          side: 'attack', role: 'Fixture pathfinder', priority: 'essential' },
      ], loadout: { primary: 'Fixture primary', secondary: 'Fixture secondary', gadget: 'Fixture crystal',
        secondaryGadget: 'Fixture utility', rationale: 'Fixture reason.', alternates: ['Fixture alternate'], source: 'recon-recommendation' } },
    { slug: 'fixture-bjorn', name: 'Fixture Bjørn', side: 'defense', role: 'Fixture watcher',
      gadget: 'Fixture gadget', when: 'Consider this fictional role when the invented setup needs observation.',
      how: 'Use the fake example to check display only.', teamFit: null, counterplay: null,
      officialUrl: example, sites: [], loadout: null },
  ],
}
