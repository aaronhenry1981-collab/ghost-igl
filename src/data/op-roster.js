// Every operator that can be banned or picked, by side.
//
// The ban chips originally offered only Aaron's own 19, which is wrong twice
// over: the enemy team bans whatever it likes (Thermite, Jager, Bandit), and a
// teammate can lock anything at all. A ban list that cannot express the ban you
// just watched happen is not a ban list.
//
// Mirrors BAN_ROSTER in aim-coach/index.html so the site and the coach agree on
// who exists.

export const OP_ROSTER = {
  attack: ['Sledge', 'Thatcher', 'Ash', 'Thermite', 'Twitch', 'Montagne', 'Glaz', 'Fuze',
    'Blitz', 'IQ', 'Buck', 'Blackbeard', 'Capitao', 'Hibana', 'Jackal', 'Ying',
    'Zofia', 'Dokkaebi', 'Lion', 'Finka', 'Maverick', 'Nomad', 'Gridlock', 'Nokk',
    'Amaru', 'Kali', 'Iana', 'Ace', 'Zero', 'Flores', 'Osa', 'Sens', 'Grim', 'Brava',
    'Ram', 'Deimos', 'Striker', 'Rauora', 'Solid Snake'],
  defense: ['Smoke', 'Mute', 'Castle', 'Pulse', 'Doc', 'Rook', 'Kapkan', 'Tachanka', 'Jager',
    'Bandit', 'Frost', 'Valkyrie', 'Caveira', 'Echo', 'Mira', 'Lesion', 'Ela', 'Vigil',
    'Maestro', 'Alibi', 'Clash', 'Kaid', 'Mozzie', 'Warden', 'Goyo', 'Wamai', 'Aruni',
    'Melusi', 'Oryx', 'Thunderbird', 'Thorn', 'Azami', 'Solis', 'Fenrir', 'Tubarao',
    'Skopos', 'Sentry', 'Denari'],
}

export default OP_ROSTER
