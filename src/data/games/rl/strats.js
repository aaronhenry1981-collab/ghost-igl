// Rocket League — per-mode, per-phase strats. "Sides" map as:
//   attack = Offense (your team has possession or initiating)
//   defense = Defense (opponent has possession or initiating)
// "Sites" are game phases within that mode.

const STRATS = {
  'standard-3v3': {
    kickoff: {
      attack: {
        operators: [
          { name: 'Striker', role: 'Center kickoff', priority: 'essential' },
          { name: '2nd Man', role: 'Cheat-up support', priority: 'essential' },
          { name: '3rd Man / Last Back', role: 'Goal cover', priority: 'essential' },
        ],
        strategy: 'Center player runs the speedflip kickoff and commits. 2nd man cheats forward off the diagonal pad to follow up. 3rd man stays at goal and covers the entire back third. Win the kickoff = win 70% of opening 30 seconds.',
        callouts: ['Speedflip', 'Diagonal-cheat', 'Center 50', 'Boost grab', 'Backboard cover'],
        utility: [
          'Speedflip the center kickoff — diagonal flip lands you a fraction of a second earlier than the opponent',
          '2nd man takes the diagonal pad and stays at 60+ boost to convert the 50',
          '3rd man boost target 80+ at all times during opening — needs to clear if they get through',
          'Call "cheat" or "back" before kickoff so the team knows who\'s converting',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Center kickoff position', from: 'Center spot', use: 'Speedflip into the ball — first to commit wins center 50' },
            { spawn: 'Left/Right diagonal cheat', from: 'Diagonal spots', use: 'Cheat forward off the diagonal pad — converts 60% of center 50 wins into goals' },
          ],
          spawnKillSpots: [
            { from: 'Center kickoff', target: 'Opponent\'s center kickoff car', risk: 'Both go for 50 — coin flip if speedflip timing is even', reward: 'Win the 50 = 5-second advantage on the ball + their net is open' },
          ],
          advancedSetups: [
            'Fake kickoff — front-flip then dodge cancel: opponent commits to their speedflip, you arrive late but they\'re gone. Win condition for slower kickoff bodies.',
            'Boost-starve kickoff: skip the diagonal pad on the way to commit, forcing 2nd man to convert. Use when 2nd man has the better mechanical aerial.',
            'Diagonal kickoff back-corner pass: instead of speedflipping the ball, flick it backward to the cheating 2nd man for an immediate aerial setup.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Striker', role: 'Mirror kickoff', priority: 'essential' },
          { name: '2nd Man', role: 'Read commit', priority: 'recommended' },
          { name: 'Goalie', role: 'Net anchor', priority: 'essential' },
        ],
        strategy: 'Mirror their kickoff: center commits, 2nd reads, last covers. If they speedflip and your center doesn\'t, retreat immediately — their cheating 2nd man will convert. Don\'t double-commit to the 50.',
        callouts: ['Mirror', 'Drop back', 'Read cheat', 'Net hold'],
        utility: [
          'If you lose the kickoff 50, hard retreat — don\'t chase the ball backward into your own net',
          'Goalie pre-aims the corner shot — 60% of converted kickoffs hit the corner',
          'Anti-fake: don\'t pre-jump the kickoff — wait until you see their commit so you don\'t whiff their fake',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Diagonal cheat position', target: 'Opponent\'s 2nd-man cheat', timing: 'First 1.5s — bump them before they reach the ball', },
          ],
          antiSpawnPeek: [
            'If your speedflip is slower than theirs, don\'t commit at all — fake out, retreat to mid, and read the kickoff outcome.',
            'Diagonal player calls "cheat" or "back" pre-kickoff so the team adjusts.',
          ],
          advancedSetups: [
            'Fake kickoff drop: pretend to commit, then drop back to mid. Forces their 2nd-man cheater to commit early so your team gets the counter.',
            'Goalie pre-aerial: if they speedflip and 2nd-man cheats, goalie pre-jumps the backboard angle.',
          ],
        },
      },
    },

    possession: {
      attack: {
        operators: [
          { name: 'Striker', role: 'Ball carrier / pressure', priority: 'essential' },
          { name: '2nd Man', role: 'Pass option / rotate', priority: 'essential' },
          { name: '3rd Man', role: 'Backboard cover', priority: 'recommended' },
        ],
        strategy: 'Striker pressures and forces defender commit. 2nd man rotates into the pass lane — never bumps into striker. 3rd man covers backboard reads. Hold possession until opponent\'s 3rd man leaves net, THEN shoot.',
        callouts: ['Holding it', 'Open net', 'Pass through', 'Backboard read', 'Reset'],
        utility: [
          'Don\'t shoot at the first available angle — hold the ball until net is actually open',
          'Pass option: 2nd man calls "pass" if they have a better angle. Striker dishes the ball forward.',
          'Boost economy: striker sniffs small pads while dribbling — never breaks possession to grab a big pad',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Wall-read corner setup', from: 'Wall reading the ball off side bounce', use: 'Catch the wall-bounce and aerial-dribble to net for guaranteed shot' },
            { spawn: 'Backboard double-tap setup', from: 'Striker passes off backboard intentionally', use: '2nd man reads the angle and double-taps it back across goal' },
          ],
          spawnKillSpots: [
            { from: 'Striker position', target: 'Opposing 1st man challenger', risk: 'If they read the bump you lose the ball', reward: 'Bumped defender = open net for 2nd man finish' },
          ],
          advancedSetups: [
            'Fake pass + flick: striker dribbles, sees defender commit to the pass, then flicks past them. Triggers a 1v1 vs goalie.',
            'Slow dribble drain: hold the ball at midfield for 5+ seconds to force opponent boost-starvation. They commit, you punish.',
            '50-50 wall pinch: pinch the ball off the side wall toward the opposite corner — unpredictable, hard to save.',
          ],
        },
      },
      defense: {
        operators: [
          { name: '1st Man / Challenger', role: 'Pressure', priority: 'essential' },
          { name: '2nd Man', role: 'Pickup / Pressure', priority: 'essential' },
          { name: 'Goalie', role: 'Anchor', priority: 'essential' },
        ],
        strategy: 'Challenge the dribble before it becomes a shot. If 1st man challenges, 2nd man picks up the loose ball. Goalie never leaves goal until 2nd man has the clear. The defender that wins is the one with the best 50/50 read, not the one with the prettiest aerial.',
        callouts: ['Going', 'Pickup', 'Holding back', 'Fake', 'Clear'],
        utility: [
          '1st-man challenge call ("going") MUST come before commit so 2nd man can adjust',
          'Don\'t double-commit — if you see your teammate going, you become 2nd man automatically',
          'Goalie shadow defense: angle car between ball and net at 45° — denies the shot without committing',
        ],
        premiumTactics: {
          runouts: [
            { from: '3rd-man position', target: 'Opponent\'s 2nd man on the rotation', timing: 'When opponent\'s striker dribbles past midfield', },
          ],
          antiSpawnPeek: [
            'Goalie shadow defense over committing — 80% of "easy" saves come from positioning, not aerials.',
            'Mid-court bumps: 2nd man can sacrifice position to bump the opponent\'s 2nd man, disrupting their pass option.',
          ],
          advancedSetups: [
            'Fake challenge: 1st man drives at the dribbler at 60% speed, then flips away. Forces the dribbler to commit early — 2nd man cleans up.',
            'Boost denial: 2nd man takes the big boost on opponent\'s side of the field. Striker can\'t pressure without boost.',
            'Backboard pre-read: goalie watches the angle of the dribble and pre-positions for the backboard read 1.5 seconds before the shot.',
          ],
        },
      },
    },

    transition: {
      attack: {
        operators: [
          { name: '1st Man', role: 'Counter-attack', priority: 'essential' },
          { name: '2nd Man', role: 'Boost grab + follow', priority: 'essential' },
          { name: 'Last Back', role: 'Reset goalie', priority: 'recommended' },
        ],
        strategy: 'You just won a 50 or got a clear — convert the transition. 1st man pushes the ball forward fast. 2nd man grabs a boost and follows up. Last back resets to net for safety. Transition windows last about 3-4 seconds — commit hard.',
        callouts: ['Going', 'Boost', 'Reset', 'Fast counter'],
        utility: [
          'After a clear, the team that wins is the one that pushes first — don\'t pause to celebrate the save',
          '2nd man grabs the boost on your side of the field, then follows the play upfield',
          'Last back NEVER leaves net during a transition until 1st AND 2nd are deep in opponent half',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Fast-break counter', from: 'Off a clear toward midfield', use: '1st man takes the open net before defender resets' },
          ],
          spawnKillSpots: [
            { from: 'Midfield after clear', target: 'Opponent\'s last back resetting', risk: 'Opponent might still have boost', reward: 'Bumped last back = open net, instant goal' },
          ],
          advancedSetups: [
            'Reset cancel: after a save, dodge-cancel out of the recovery to gain forward momentum faster.',
            'Boost-pad rotation: 2nd man takes only small pads on the way upfield so they\'re full-boost on the goal.',
          ],
        },
      },
      defense: {
        operators: [
          { name: '1st Man', role: 'Slow counter', priority: 'essential' },
          { name: '2nd Man', role: 'Backline cover', priority: 'essential' },
          { name: 'Goalie', role: 'Last man up', priority: 'essential' },
        ],
        strategy: 'You just lost a 50 or your dribble. Retreat in formation — don\'t scramble. 1st man slows the opponent\'s counter with a bump or fake challenge. 2nd man covers midfield. Goalie pre-positions for the inevitable shot.',
        callouts: ['Retreat', 'Slow it', 'Net', 'Backboard'],
        utility: [
          'Retreating boost economy: skip the small pads, head for the big pad behind your net',
          'Slow the counter with a bump — buy 1 second for your goalie to set up',
          'Goalie shadow stance: don\'t commit until the shot is taken',
        ],
        premiumTactics: {
          runouts: [
            { from: '1st-man retreat', target: 'Opponent\'s 2nd man on the counter', timing: '2-3 seconds after they win the 50', },
          ],
          antiSpawnPeek: [
            'Pre-position 2 seconds before the shot — counter-attackers rush, you wait for the angle.',
            'Goalie call: tell 2nd man "I have it" so they pick up the loose ball after your save.',
          ],
          advancedSetups: [
            'Recovery dash: after your defensive save, wave-dash on landing to immediately push the counter the other way.',
            '50/50 backboard read: when opponent shoots high, watch the angle and pre-position for the second-touch where the ball lands off backboard.',
          ],
        },
      },
    },

    defense: {
      attack: {
        operators: [
          { name: 'Striker', role: 'Pressure reset', priority: 'recommended' },
          { name: '2nd Man', role: 'Cleanup', priority: 'essential' },
          { name: 'Goalie', role: 'Save + clear', priority: 'essential' },
        ],
        strategy: 'When you\'re on defense and they shoot, the goalie\'s job is to save AND clear in the same touch. The "save into corner" + 2nd man pickup = counter-attack starter. Striker rotates up immediately on the save call.',
        callouts: ['Save', 'Clear corner', 'Pickup', 'Counter'],
        utility: [
          'Don\'t just save — clear the ball toward the corner so it doesn\'t come back through midfield',
          '2nd man pre-positions for the pickup on the corner — striker pushes upfield for the counter',
          'Backboard reads: 60% of shots come off backboard — pre-position for the rebound, not the first touch',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Backboard clear to striker', from: 'Goalie clearing off backboard angle', use: 'Striker has open midfield to start a counter — guaranteed shot if 1st man wins it' },
          ],
          spawnKillSpots: [
            { from: 'After a save', target: 'Opponent\'s overcommitted striker', risk: 'They might double-commit and clear', reward: 'Open backboard if you can hit it' },
          ],
          advancedSetups: [
            'Save + double-touch: goalie saves AND pushes the ball forward with the same touch (rare, high-skill, GC+ mechanic).',
            'Corner clear timing: aim the clear so it bounces off the side wall to your 2nd man on the rotation.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Goalie', role: 'Net hold', priority: 'essential' },
          { name: '2nd Man', role: 'Save cover', priority: 'essential' },
          { name: '1st Man', role: 'Pressure', priority: 'recommended' },
        ],
        strategy: 'They\'re shooting, you\'re saving. Goalie reads the angle and positions BEFORE the shot. 2nd man covers a potential rebound. 1st man pressures the shooter so they don\'t get a clean shot off. Save + clear + reset = round won.',
        callouts: ['Net', 'Backboard', 'Rebound', 'Reset'],
        utility: [
          'Pre-position for the rebound — 60% of "easy saves" turn into goals because no one covered the second touch',
          'Goalie ball-cam OFF during shadow defense — better for spatial awareness vs the ball',
          'Don\'t commit to the save until the shot is taken — fakes will catch you out',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Goalie net hold', target: 'Opponent striker', timing: 'After save — instantly push the counter' },
          ],
          antiSpawnPeek: [
            'Boost denial: 1st man takes the boost behind opponent\'s net so they can\'t reset.',
            'Backboard double-cover: 2nd man + 3rd man both cover the backboard angle on cross shots.',
          ],
          advancedSetups: [
            'Backboard reads: train backboard saves in custom training — knowing where the ball lands turns 50/50 saves into 100%.',
            'Wall save: if opponent shoots into the corner, save off the wall instead of letting it bounce into goal.',
            'Recovery into clear: after the save, immediately wave-dash + boost forward to start your team\'s counter.',
          ],
        },
      },
    },
  },

  // 2v2 — only 2 phases that matter most: kickoff and defense
  'standard-2v2': {
    kickoff: {
      attack: {
        operators: [
          { name: 'Striker', role: 'Kickoff commit', priority: 'essential' },
          { name: 'Back', role: 'Net cover + cheat boost', priority: 'essential' },
        ],
        strategy: 'In 2v2, the kickoff matters even more than 3v3 — you have one teammate to cover. Center commits, back grabs the big boost behind net and reads. If you lose the 50, back must cover both rotations.',
        callouts: ['Speedflip', 'Boost', 'Cover', 'Cheat'],
        utility: [
          'Speedflip is mandatory at Diamond+ for 2v2',
          'Back player grabs big boost behind net during kickoff, then reads the play',
          'Communicate "going" or "back" pre-kickoff so you know your role',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Center kickoff', from: 'Speedflip diagonal flick', use: 'Win the 50 — opponent\'s back will scramble' },
          ],
          spawnKillSpots: [
            { from: 'Center 50', target: 'Opponent\'s back rotating up', risk: 'Coin flip on the 50 itself', reward: 'Won 50 in 2v2 = 60% goal rate' },
          ],
          advancedSetups: [
            'Fake kickoff (front-flip cancel): forces opponent to commit, you arrive late with control.',
            'Diagonal speedflip: angled flip catches center 50s with momentum advantage.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Mirror striker', role: 'Center commit', priority: 'essential' },
          { name: 'Back', role: 'Read + cover', priority: 'essential' },
        ],
        strategy: 'Mirror their kickoff. If you lose the 50, your back covers — don\'t try to flank. 2v2 punishes any over-commit harder than 3v3 because there\'s no 3rd man cleaning up.',
        callouts: ['Mirror', 'Lost it', 'Cover'],
        utility: [
          'Don\'t double-commit on a 2v2 kickoff — back stays back, period',
          'Read their speedflip — if they have it and you don\'t, drop back immediately',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Back position', target: 'Opponent\'s back after their commit', timing: 'When their striker commits early', },
          ],
          antiSpawnPeek: [
            'Slow kickoff: don\'t commit at all if your speedflip is slower — fake out and read.',
            'Back-corner stall: drop deep into corner instead of net, force them to overcommit.',
          ],
          advancedSetups: [
            'Counter speedflip: read their angle and counter-flip to deflect the 50 sideways instead of letting it bounce.',
          ],
        },
      },
    },
    possession: {
      attack: {
        operators: [
          { name: 'Dribbler', role: 'Ball control', priority: 'essential' },
          { name: 'Backup', role: 'Pass / cleanup', priority: 'essential' },
        ],
        strategy: 'In 2v2 possession, the dribbler must commit shots — there\'s no 3rd man to support. Backup reads the angle and is ready for the rebound. Don\'t hold possession too long — 2v2 favors fast strikes.',
        callouts: ['Dribble', 'Pass', 'Open'],
        utility: [
          'Dribbler boost target 50+ — needs to commit the shot, can\'t afford to lose boost mid-shot',
          'Backup rotates through midfield, never behind the dribbler',
          'Pass calls are crucial — 2v2 passes get more open nets than 3v3',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Backboard double-tap', from: 'Dribbler off backboard', use: 'Backup reads angle and double-taps cross-goal' },
          ],
          spawnKillSpots: [
            { from: 'Dribble position', target: 'Opposing defender', risk: 'Lost dribble = open net the other way', reward: '2v2 open-net goal' },
          ],
          advancedSetups: [
            'Quick double-pinch: pass to backup, backup pinches into net before defender resets.',
            'Boost-starve hold: keep the ball at midfield for 4+ seconds to force opponent boost-out.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Challenger', role: 'Pressure', priority: 'essential' },
          { name: 'Goalie', role: 'Anchor', priority: 'essential' },
        ],
        strategy: 'Challenger commits to break the dribble, goalie covers absolute net. NO double-commits — 2v2 punishes this instantly. If challenger fails, goalie saves and starts counter.',
        callouts: ['Going', 'Have it', 'Pickup'],
        utility: [
          'Challenger calls "going" before the commit — goalie adjusts to anchor',
          'Goalie reads angle 1.5 seconds before the shot — pre-positions for the save',
          'Recovery: after save, immediately push the counter — 2v2 counter-attacks are devastating',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Goalie position', target: 'After a save, counter the opponent', timing: 'Immediately after save touch', },
          ],
          antiSpawnPeek: [
            'Shadow defense: goalie angles car between ball and net at 45° — saves shots without committing.',
            'Boost denial: challenger takes opponent-side big boost so they can\'t reset.',
          ],
          advancedSetups: [
            'Save + clear corner: goalie saves AND clears toward the corner where opponent can\'t reach — instant counter setup.',
          ],
        },
      },
    },
    defense: {
      attack: {
        operators: [
          { name: 'Goalie', role: 'Save + clear', priority: 'essential' },
          { name: 'Backup', role: 'Pickup', priority: 'essential' },
        ],
        strategy: 'After a save in 2v2, the goalie has 1 second before opponent re-pressures. Clear toward the corner, backup picks up, COUNTER. The counter-attack out of a save is the highest-EV play in 2v2.',
        callouts: ['Save', 'Pickup', 'Counter'],
        utility: [
          'Clear to corner, not midfield — corner clears give your backup space to start the counter',
          'Backup pre-positions for the pickup — don\'t wait to see where the clear goes',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Goalie clear to corner', from: 'Save off the backboard', use: 'Backup picks up the corner ball and counter-attacks open net' },
          ],
          advancedSetups: [
            'Goalie save + double-touch: save AND drive the ball forward in the same touch — high-skill but devastating.',
            'Corner pinch: backup pinches the corner ball into a center cross — opens net wide.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Goalie', role: 'Net hold', priority: 'essential' },
          { name: 'Backup', role: 'Cover rebound', priority: 'essential' },
        ],
        strategy: 'They\'re shooting. Goalie reads angle, backup covers rebound. After the save, immediately rotate to counter. 2v2 defense becomes offense FAST.',
        callouts: ['Net', 'Rebound', 'Counter'],
        utility: [
          'Goalie pre-position 1.5 seconds before shot — reads angle, not ball',
          'Backup covers the rebound side, never the same side as goalie',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Goalie position', target: 'Forward after save', timing: 'Immediately after save' },
          ],
          antiSpawnPeek: [
            'Cover the cross-rebound: 60% of rebounds in 2v2 land on the opposite side of the goal.',
            'Boost denial: take opponent-side big boost after the save.',
          ],
          advancedSetups: [
            'Backboard pre-read: watch shot angle, pre-jump the backboard rebound 0.5s before it lands.',
            'Save + push: goalie saves AND continues forward to start the counter — backup covers net.',
          ],
        },
      },
    },
  },

  // 1v1 — pure mechanical mode. Phases reduced.
  'standard-1v1': {
    kickoff: {
      attack: {
        operators: [
          { name: 'You', role: 'Solo kickoff', priority: 'essential' },
        ],
        strategy: 'In 1v1 every kickoff is yours. Speedflip is mandatory above Diamond. If you don\'t have it, fake kickoffs and read your opponent.',
        callouts: ['Speedflip', 'Fake', 'Diagonal'],
        utility: [
          'Speedflip the center 50 — diagonal-flip lands fractions of a second ahead',
          'Fake kickoff = stop short of ball, force opponent to commit, then drive past',
          'Boost: opponent\'s diagonal big boost is the highest-value grab on the map',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Center speedflip', from: 'Center spot', use: 'Win the 50 — open net' },
            { spawn: 'Diagonal cheat kickoff', from: 'Diagonal corner', use: 'Take diagonal pad first, arrive at ball with boost advantage' },
          ],
          spawnKillSpots: [
            { from: 'Speedflip arrival', target: 'Opponent\'s car', risk: 'Even speedflip race', reward: '1v1 won 50 = 65% goal rate' },
          ],
          advancedSetups: [
            'Fake-flip-cancel: front-flip + dodge cancel to confuse opponent\'s commit timing.',
            'Wave-dash kickoff: dash sideways into the ball to redirect at unexpected angle.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'You', role: 'Solo mirror', priority: 'essential' },
        ],
        strategy: 'If you don\'t have speedflip and they do, fake the kickoff entirely. Drop to net, force them to do something with possession.',
        callouts: ['Drop', 'Mirror'],
        utility: [
          'No speedflip + opponent has speedflip = always fake the kickoff',
          'Drop straight to net, let them figure out a shot from possession',
        ],
        premiumTactics: {
          antiSpawnPeek: [
            'Don\'t commit to a 50 you\'ll lose. Drop to net + read.',
            'Watch opponent\'s kickoff angle for tells — if they always speedflip from the same side, position for the counter.',
          ],
          advancedSetups: [
            'Counter speedflip: deflect the ball sideways instead of meeting it head-on.',
          ],
        },
      },
    },
    recovery: {
      attack: {
        operators: [
          { name: 'You', role: 'Solo recovery', priority: 'essential' },
        ],
        strategy: '1v1 recovery is everything. Wave-dash on every landing. Half-flip after every clear. Boost economy: 60+ at all times.',
        callouts: ['Recovery', 'Boost'],
        utility: [
          'Wave-dash on every landing — recover 2x faster than rolling',
          'Half-flip on backward direction changes — never reverse-drive',
          'Boost target 60+ at all times in 1v1 — without boost, you lose every aerial',
        ],
        premiumTactics: {
          advancedSetups: [
            'Air-roll recovery: orient car mid-air so wheels are pointed at the ground for instant boost-and-go landings.',
            'Boost pad routing: chain small pads on the way back to position — don\'t stop for big boosts.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'You', role: 'Solo defender', priority: 'essential' },
        ],
        strategy: 'In 1v1 defense, the goal-line save is everything. Pre-position 1.5s before their shot. Save AND clear.',
        callouts: ['Save', 'Read', 'Clear'],
        utility: [
          'Pre-read shot angle 1.5 seconds before it\'s taken',
          'Save to corner, never to midfield — midfield clears = instant rebound',
        ],
        premiumTactics: {
          antiSpawnPeek: [
            'Shadow defense angle: 45° between ball and net — denies shot without committing.',
            'Don\'t commit to fake shots — wait for the actual flick before reacting.',
          ],
          advancedSetups: [
            'Backboard read mastery — train this in custom training; 70% of 1v1 shots come off the backboard.',
          ],
        },
      },
    },
    defense: {
      attack: {
        operators: [{ name: 'You', role: 'Save into counter', priority: 'essential' }],
        strategy: 'After every save, immediately counter. Opponent is out of position 80% of the time post-shot.',
        callouts: ['Counter'],
        utility: [
          'Push the counter on every save — don\'t reset to net',
          'Wave-dash recovery off the save to gain speed forward',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Save into counter', from: 'Post-save recovery', use: 'Push forward immediately — opponent is out of position' },
          ],
          advancedSetups: [
            'Save + double-touch: save the ball AND drive it forward in one motion. SSL-tier mechanic.',
          ],
        },
      },
      defense: {
        operators: [{ name: 'You', role: 'Goalkeeper mode', priority: 'essential' }],
        strategy: 'Pre-position. Read. Save. Clear corner. Counter. 1v1 defense is a 5-step loop.',
        callouts: ['Net', 'Save', 'Clear'],
        utility: [
          'Pre-position before shot — don\'t react after',
          'Clear to corner so opponent can\'t pick up the rebound',
        ],
        premiumTactics: {
          antiSpawnPeek: [
            'Read shot type: pinch vs flick vs aerial. Each requires different save positioning.',
          ],
          advancedSetups: [
            'Save + recovery dash: dash forward off the save to immediately push the counter.',
          ],
        },
      },
    },
  },

  // Tournaments 3v3 — series structure with multi-game adjustments
  tournaments: {
    'series-start': {
      attack: {
        operators: [
          { name: 'IGL', role: 'Reads opponent', priority: 'essential' },
          { name: 'Striker', role: 'Comp test', priority: 'essential' },
          { name: 'Last Back', role: 'Anchor', priority: 'essential' },
        ],
        strategy: 'Game 1 of a tournament series is a scouting game. Test your default comp, watch opponent rotation tells, identify which player to bump or pressure. Don\'t commit to a high-risk comp until you\'ve seen game 1.',
        callouts: ['Default', 'Reading', 'Test'],
        utility: [
          'Run your most-comfortable comp in game 1 — tournament nerves cost games',
          'IGL tracks opponent boost economy, rotation speed, and who panic-clears',
          'Don\'t reveal fancy mechanics in game 1 — save them for closeout',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Default 3v3 setup', from: 'Center kickoff', use: 'Establish comp baseline before adjusting' },
          ],
          spawnKillSpots: [
            { from: 'Striker pressure', target: 'Opponent\'s least-mechanical player', risk: 'Reveal your bump strategy early', reward: 'Tilt-target identified for games 2-3' },
          ],
          advancedSetups: [
            'Boost-pad map control: take opponent\'s big boosts to starve their striker even in game 1.',
            'Time-management calls: IGL calls "stall" when ahead, "push" when behind on series clock.',
            'Read opponent\'s kickoff style — one team usually runs the same speedflip 5+ games in a row.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Mirror IGL', role: 'Counter-reads', priority: 'essential' },
          { name: 'Goalie', role: 'Net anchor', priority: 'essential' },
          { name: '2nd Man', role: 'Read commit', priority: 'recommended' },
        ],
        strategy: 'Mirror their comp in game 1. Identify which of their players panics on aerial saves. Game 1 defense is about gathering intel — don\'t go all-in on counter-mechanics yet.',
        callouts: ['Mirror', 'Read'],
        utility: [
          'Identify the panic-saver: which opponent over-commits to easy saves?',
          'Identify the boost-hog: who always grabs the big boost on rotation?',
          'Don\'t double-commit in game 1 — you\'re still learning their tendencies',
        ],
        premiumTactics: {
          runouts: [
            { from: '2nd-man position', target: 'Opponent\'s boost-hog after they grab their big', timing: 'Right after they take the boost', },
          ],
          antiSpawnPeek: [
            'Don\'t reveal your double-commit reads in game 1.',
            'Goalie plays standard shadow defense — save the unusual angles for games 2-3.',
          ],
          advancedSetups: [
            'Mid-game IGL call: pause to discuss what you learned after game 1.',
          ],
        },
      },
    },
    'comp-adjust': {
      attack: {
        operators: [
          { name: 'IGL', role: 'Comp swap caller', priority: 'essential' },
          { name: 'Striker', role: 'New mechanic deployment', priority: 'recommended' },
          { name: 'Last Back', role: 'Stays consistent', priority: 'essential' },
        ],
        strategy: 'Between games 1 and 2, you adjust. If their defense over-rotates, run Double Attack. If they boost-starve well, swap to Possession. The IGL makes the call based on game 1 data — striker and last back execute.',
        callouts: ['Adjust', 'Swap', 'New comp'],
        utility: [
          'IGL calls the comp swap based on opponent tendencies',
          'Don\'t change ALL three roles between games — keep continuity',
          'Striker deploys the mechanic you saved in game 1 (musty flick, air dribble setup, etc.)',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Counter-comp execution', from: 'Adjusted comp first kickoff', use: 'Hit the opponent\'s weak spot identified in game 1' },
          ],
          spawnKillSpots: [
            { from: 'Striker direct', target: 'Opponent\'s panic-saver', risk: 'They might adjust mid-series', reward: 'Tilt cascade — they tilt, you snowball' },
          ],
          advancedSetups: [
            'Pre-call the bump: IGL says "bump 3-man on next aerial" before the play starts so everyone knows.',
            'Boost denial: take opponent\'s big boost every rotation to starve their striker.',
            'Targeted pressure: pick the opponent player who tilted hardest in game 1 and pressure them every play.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'IGL', role: 'Defensive comp swap', priority: 'essential' },
          { name: 'Goalie', role: 'Counter-mechanic prep', priority: 'essential' },
        ],
        strategy: 'If you lost game 1 because their striker air-dribbled past you, your goalie pre-positions for air dribbles. If they bombed you with pinches, you stagger your rotations. The IGL adjusts defense based on what worked / didn\'t.',
        callouts: ['Counter-pos', 'Stagger'],
        utility: [
          'Goalie pre-positions for the opponent\'s favorite mechanic',
          'Stagger rotation to deny their fast-counter setups',
          'Take their boost pads on every rotation',
        ],
        premiumTactics: {
          runouts: [
            { from: 'IGL position', target: 'Their striker before they get the boost', timing: 'Between possessions' },
          ],
          antiSpawnPeek: [
            'Counter their kickoff: if they always speedflip diagonally, position your 2nd man at that diagonal.',
            'Bait their air dribble setup — drop back and let them whiff the aerial, then counter.',
          ],
          advancedSetups: [
            'Boost-starve: take all 4 big boosts on rotation. Their striker can\'t mechanic without boost.',
            'Pre-position aerial counter — if you know they air-dribble, your goalie pre-jumps the angle.',
          ],
        },
      },
    },
    closeout: {
      attack: {
        operators: [
          { name: 'IGL', role: 'Time management', priority: 'essential' },
          { name: 'Striker', role: 'Closeout shot', priority: 'essential' },
          { name: 'Last Back', role: 'No-mistakes', priority: 'essential' },
        ],
        strategy: 'You\'re up 2-1 in a best-of-five (or 1-0 in a best-of-three) and have a chance to close out. Last Back NEVER leaves net. Striker plays it safe — no fancy mechanics, just clean shots. IGL calls timeouts at the right moments to disrupt opponent flow.',
        callouts: ['Close', 'Safe', 'No risks'],
        utility: [
          'No fancy mechanics in closeout — clean shots only',
          'Last back stays at home. Period.',
          'IGL calls timeout when momentum shifts toward opponent',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Safe-and-stall comp', from: 'Possession-style 3v3', use: 'Run the clock down with possession, force opponent overcommit' },
          ],
          spawnKillSpots: [
            { from: 'Striker pressure', target: 'Opponent\'s tilted player', risk: 'They might break out of tilt', reward: 'Game-winning bump' },
          ],
          advancedSetups: [
            'Boost-starve closeout: take every boost on opponent\'s side to deny their final push.',
            'Pace control: slow the game down, force their striker to make a mistake.',
            'IGL timeout management: pause after a goal to break their momentum.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Goalie', role: 'Save everything', priority: 'essential' },
          { name: 'IGL', role: 'Pace control', priority: 'essential' },
          { name: '1st Man', role: 'No-foul pressure', priority: 'essential' },
        ],
        strategy: 'You\'re down a game and need to defend a chance. Goalie reads every shot 1.5s ahead. IGL calls every rotation. 1st man pressures but never panic-commits. No tilted plays — one mistake ends the series.',
        callouts: ['Save', 'Hold', 'No risks'],
        utility: [
          'Goalie pre-positions for every shot — no scrambling',
          'No double-commits — series-ending mistake territory',
          'IGL controls the pace — call rotations one play ahead',
        ],
        premiumTactics: {
          runouts: [
            { from: 'Goalie position', target: 'Forward after every save', timing: 'Instant counter — extend the series' },
          ],
          antiSpawnPeek: [
            'Take every big boost — deny their final push.',
            'Don\'t panic-clear off backboard — read where ball lands, position for the second touch.',
            'Goalie shadow stance over committing — saves come from positioning, not aerials.',
          ],
          advancedSetups: [
            'Backboard read mastery — train this in custom training before tournament play.',
            'Save + counter combo: every save becomes a fast counter to extend the series.',
            'Boost denial: take all 4 big boosts behind their net every rotation.',
          ],
        },
      },
    },
  },

  // Hoops — 2v2 basketball mode
  hoops: {
    'dunk-setup': {
      attack: {
        operators: [
          { name: 'Aerial striker', role: 'Dunker', priority: 'essential' },
          { name: 'Pass option', role: 'Wall setter', priority: 'essential' },
        ],
        strategy: 'Hoops dunks come from wall-pop passes. Wall setter pops the ball off the side wall toward the hoop, dunker aerials in for the slam. Practice the wall-pop angle in freeplay.',
        callouts: ['Wall pop', 'Dunk', 'Aerial'],
        utility: [
          'Wall setter pinches the ball into the hoop area at 45° off the side wall',
          'Dunker aerials from below the hoop and slams downward',
          'Boost 80+ before the dunk attempt — aerial dunks are boost-hungry',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Wall pinch setup', from: 'Side wall hit', use: 'Pinch the ball off the wall directly into the hoop opening' },
            { spawn: 'Backboard ricochet', from: 'High shot off backboard', use: 'Ball bounces into the hoop on a soft hit' },
          ],
          advancedSetups: [
            'Air dribble dunks: control the ball mid-air and tap it into the hoop from above.',
            'Off-wall double-tap: hit the wall, then double-tap the rebound into the hoop.',
          ],
        },
      },
      defense: {
        operators: [
          { name: 'Aerial blocker', role: 'Above-rim defender', priority: 'essential' },
          { name: 'Net rebound', role: 'Below-rim cover', priority: 'essential' },
        ],
        strategy: 'Hoops defense is layered: one player above the rim to block dunks, one below to clean up rebounds. Don\'t both go for the block — that\'s how 100% of hoops goals happen.',
        callouts: ['Block', 'Rebound', 'Cover'],
        utility: [
          'Above-rim defender pre-jumps the aerial dunk',
          'Below-rim defender catches the rebound and clears',
        ],
        premiumTactics: {
          antiSpawnPeek: [
            'Don\'t both leave the net for the block — coin-flip on the dunk, but a missed block = guaranteed open goal.',
            'Pre-jump the aerial dunk — wait until you see the dunker commit.',
          ],
          advancedSetups: [
            'Backboard read on hoops: predict where the ball lands off the backboard before the dunk is even attempted.',
          ],
        },
      },
    },
    defense: {
      attack: {
        operators: [{ name: 'Clearer', role: 'Net + push', priority: 'essential' }, { name: 'Counter', role: 'Run + dunk', priority: 'recommended' }],
        strategy: 'Counter the opponent\'s dunk attempt with your own aerial. After save, immediately push for a counter-dunk.',
        callouts: ['Save', 'Counter', 'Push'],
        utility: [
          'Save the dunk attempt with a forward push, not a defensive block',
          'After save, push the ball toward opponent\'s hoop for counter-dunk',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Counter-dunk off save', from: 'Defensive save toward opponent hoop', use: 'Catch ball mid-air and dunk on the other end' },
          ],
          advancedSetups: [
            'Wall-bounce counter: clear off the wall toward your dunker on the other end.',
          ],
        },
      },
      defense: {
        operators: [{ name: 'Goalie', role: 'Below-rim', priority: 'essential' }, { name: 'Cover', role: 'Above-rim', priority: 'essential' }],
        strategy: 'Hold below the rim, cover above the rim, no double-commits.',
        callouts: ['Net', 'Above'],
        utility: ['Below-rim goalie reads aerial direction', 'Above-rim cover times the block'],
        premiumTactics: {
          antiSpawnPeek: ['Pre-jump the aerial dunk', 'Don\'t both leave the net'],
          advancedSetups: ['Triple-block setup if opponent commits to long-range pinch'],
        },
      },
    },
  },

  // Snow Day — hockey mode
  'snow-day': {
    'face-off': {
      attack: {
        operators: [
          { name: 'Center', role: 'Puck commit', priority: 'essential' },
          { name: 'Wing', role: 'Pickup', priority: 'essential' },
        ],
        strategy: 'Snow Day face-off: center commits to the puck, wing positions for the pickup. Puck doesn\'t bounce — it slides — so commit hard. No speedflip needed; just first to the puck wins.',
        callouts: ['Puck', 'Pickup'],
        utility: [
          'Center commits straight to puck — no flip cancel',
          'Wing reads angle and pre-positions for the slide',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Center face-off', from: 'Direct commit', use: 'Win the puck, pass to wing for shot' },
          ],
          advancedSetups: [
            'Puck-flick from below: tap the puck upward into a wing aerial shot.',
            'Wall-pinch puck setups: pinch the puck off the side wall into the corner of the net.',
          ],
        },
      },
      defense: {
        operators: [{ name: 'Mirror', role: 'Puck contest', priority: 'essential' }, { name: 'Net', role: 'Coverage', priority: 'essential' }],
        strategy: 'Mirror the face-off, don\'t over-commit. Snow Day pucks slide unpredictably — back stays back.',
        callouts: ['Mirror', 'Back'],
        utility: ['Don\'t double-commit on face-off', 'Read the puck slide angle'],
        premiumTactics: {
          antiSpawnPeek: ['Drop back if you lose the puck', 'Read the wing position'],
          advancedSetups: ['Counter face-off: deflect the puck sideways to your wing'],
        },
      },
    },
    possession: {
      attack: {
        operators: [{ name: 'Dribbler', role: 'Puck control', priority: 'essential' }, { name: 'Cleanup', role: 'Pickup', priority: 'essential' }],
        strategy: 'Slide the puck along the surface, force opponent commit, then shoot. Snow Day puck doesn\'t flick — it slides — so passes go further than expected.',
        callouts: ['Slide', 'Pass', 'Shoot'],
        utility: ['Slide passes are faster than expected — opponent under-rotates', 'Boost target 60+ for shots'],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Wall pass into shot', from: 'Side wall slide', use: 'Pass off wall to cleanup for the goal' },
          ],
          advancedSetups: ['Puck flick: tap puck upward into aerial shot', 'Corner setup pinch'],
        },
      },
      defense: {
        operators: [{ name: 'Challenger', role: 'Puck pressure', priority: 'essential' }, { name: 'Goalie', role: 'Net hold', priority: 'essential' }],
        strategy: 'Challenger pressures the puck, goalie anchors net. Snow Day saves are different — puck slides into goal, doesn\'t bounce.',
        callouts: ['Pressure', 'Net'],
        utility: ['Challenger reads slide angle', 'Goalie covers low — puck slides on ground'],
        premiumTactics: {
          antiSpawnPeek: ['Pre-position low for puck slide', 'No high aerial saves — they\'re unnecessary'],
          advancedSetups: ['Slide-to-clear: save AND push puck out of zone in one touch'],
        },
      },
    },
    defense: {
      attack: {
        operators: [{ name: 'Counter', role: 'Save into push', priority: 'essential' }],
        strategy: 'Snow Day counter-attacks are fast — puck doesn\'t bounce, opponent can\'t recover quickly.',
        callouts: ['Counter'],
        utility: ['Push immediately after save'],
        premiumTactics: { advancedSetups: ['Save into long-pass to wing for counter-goal'] },
      },
      defense: {
        operators: [{ name: 'Goalie', role: 'Net + rebound', priority: 'essential' }],
        strategy: 'Hold net low, read puck slide, save and clear.',
        callouts: ['Net'],
        utility: ['Cover low corner'],
        premiumTactics: { antiSpawnPeek: ['Pre-position for puck slide angle'] },
      },
    },
  },

  // Dropshot — tile floor mode
  dropshot: {
    opening: {
      attack: {
        operators: [{ name: 'Tile breaker', role: 'Power shot', priority: 'essential' }, { name: 'Setup', role: 'Pass + aerial', priority: 'essential' }],
        strategy: 'Dropshot opens the floor by damaging tiles with each ball hit. Hit the ball hard to damage tiles, hit harder (powered up) to break them. Aerial shots from height = max damage.',
        callouts: ['Open', 'Power', 'Aerial'],
        utility: [
          'Aerial shots from high altitude do max tile damage',
          'Pass setups: hit the ball into the air for partner to power-shot',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'High aerial power shot', from: 'High in the air', use: 'Max-damage shot breaks tiles instantly' },
          ],
          advancedSetups: ['Pinch power shots off the wall', 'Coordinated aerial passes for max-power finish'],
        },
      },
      defense: {
        operators: [{ name: 'Tile cover', role: 'Floor defense', priority: 'essential' }, { name: 'Aerial reader', role: 'Anti-aerial', priority: 'essential' }],
        strategy: 'Don\'t let the ball hit your tiles. Clear it back to their side or take it up into the air to neutralize damage.',
        callouts: ['Up', 'Clear', 'Cover'],
        utility: ['Clear ball UP, not just away — keep it in the air', 'Cover damaged tiles first — broken tiles = goal area'],
        premiumTactics: {
          antiSpawnPeek: ['Pre-position over damaged tiles', 'Read aerial shot angle'],
          advancedSetups: ['Mid-air ball reset: catch ball mid-air to neutralize their power-up'],
        },
      },
    },
    breaking: {
      attack: {
        operators: [{ name: 'Breaker', role: 'Power finisher', priority: 'essential' }],
        strategy: 'Once tiles are open, drop the ball through. Aerial shot straight down through the broken area = goal.',
        callouts: ['Drop', 'Through'],
        utility: ['Aim shots through broken tile area', 'Max boost for the power shot'],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Through-hole power dunk', from: 'Above the broken tiles', use: 'Drop ball straight down through opening' },
          ],
          advancedSetups: ['Flip-reset before drop shot for max power', 'Coordinated aerial breaker'],
        },
      },
      defense: {
        operators: [{ name: 'Hole cover', role: 'Broken tile defender', priority: 'essential' }],
        strategy: 'Cover the broken area. Force opponent to power up other tiles first.',
        callouts: ['Cover', 'Hole'],
        utility: ['Sit over the broken tile area', 'Clear any ball that touches it'],
        premiumTactics: { antiSpawnPeek: ['Always cover the largest hole first'] },
      },
    },
    defense: {
      attack: {
        operators: [{ name: 'Counter', role: 'Reverse-shot', priority: 'essential' }],
        strategy: 'After saving, push the ball back to their side with damage. Reverse the tile damage as your counter.',
        callouts: ['Reverse'],
        utility: ['Power-shot the cleared ball back at their broken tiles'],
        premiumTactics: { advancedSetups: ['Save into counter-aerial-power-shot'] },
      },
      defense: {
        operators: [{ name: 'Floor goalie', role: 'Tile + clear', priority: 'essential' }],
        strategy: 'Defensive recovery in Dropshot is about keeping your floor whole. Clear high, clear far.',
        callouts: ['Floor', 'Clear high'],
        utility: ['Always clear UP, not flat'],
        premiumTactics: { advancedSetups: ['Backboard floor-protect read'] },
      },
    },
  },

  // Rumble — power-up mode
  rumble: {
    'power-up-advantage': {
      attack: {
        operators: [{ name: 'Power-up holder', role: 'Item user', priority: 'essential' }, { name: 'Cleanup', role: 'Followup', priority: 'recommended' }],
        strategy: 'When you have a power-up advantage, use it aggressively. Boots = run them down. Grappling claw = pull yourself toward goal. Magnetic = ball follows you. Each power-up has a 6-7 second window.',
        callouts: ['Got it', 'Now', 'Followup'],
        utility: [
          'Boots: drive directly through opponent for bumps',
          'Grappling claw: pull ball toward you, then shoot',
          'Magnetic ball: drive forward, ball follows',
          'Tornado: spin near defenders to disrupt',
        ],
        premiumTactics: {
          attackSpawns: [
            { spawn: 'Boots + ball lock setup', from: 'Held power-up', use: 'Activate near opponent to instantly bypass defense' },
          ],
          advancedSetups: ['Stack two power-ups with team coordination', 'Save power-up for when opponent has no item'],
        },
      },
      defense: {
        operators: [{ name: 'Item-aware defender', role: 'Read + cover', priority: 'essential' }],
        strategy: 'Watch the power-up icons. If opponent has Boots, don\'t challenge directly. If they have Grappling Claw, expect aerial pull.',
        callouts: ['Item up', 'Watch out'],
        utility: ['Stall until their power-up expires', 'Disengage if they have Boots'],
        premiumTactics: { antiSpawnPeek: ['Time your save for after their power-up expires', 'Bait their item use, then commit'] },
      },
    },
    scramble: {
      attack: {
        operators: [{ name: 'Pressure', role: 'No-item attack', priority: 'essential' }],
        strategy: 'When no items are active, play like a normal RL game but expect chaos at any moment. New power-ups drop every 10-15 seconds.',
        callouts: ['No item', 'Normal'],
        utility: ['Play standard rotation', 'Don\'t commit too hard — items drop randomly'],
        premiumTactics: { advancedSetups: ['Hold mid-field to grab the next item spawn'] },
      },
      defense: {
        operators: [{ name: 'Anchor', role: 'Wait for item', priority: 'essential' }],
        strategy: 'Wait for your next item, then counter. Don\'t over-extend when item-less.',
        callouts: ['Wait', 'Anchor'],
        utility: ['Hold net until you have a power-up', 'Bait opponent into wasting their item'],
        premiumTactics: { antiSpawnPeek: ['Pre-position for the item drop location'] },
      },
    },
  },
}

export default STRATS
