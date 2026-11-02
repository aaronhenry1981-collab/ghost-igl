import { STACK_SIZES } from './stack-planning.mjs'

export default function StackPlanner({ planning, onChange, local = false, hostingLimit }) {
  return <section className="sq-card sq-stack-planner" aria-labelledby="stack-planning-title">
    <h2 id="stack-planning-title">Plan for your squad size</h2>
    <p>Coordinated means players agreeing to the same exercise, including you.</p>
    <fieldset><legend>Coordinated players for this exercise</legend><div className="sq-size-options">{STACK_SIZES.map(size => <button type="button" key={size} aria-pressed={planning.size === size} onClick={() => onChange(size)}>{size} {size === 1 ? 'player' : 'players'}</button>)}</div></fieldset>
    <p className="sq-planning-status" role="status">Planning for {planning.size} coordinated {planning.size === 1 ? 'player' : 'players'}. {planning.confirmedCount} {local ? 'synthetic demo' : 'confirmed app'} {planning.confirmedCount === 1 ? 'member' : 'members'} in this room.{planning.missingCoordinated > 0 && <strong> {planning.missingCoordinated} still needed.</strong>}</p>
    <p>This preview does not add people or change the shared plan. The IGL selects the drill explicitly.</p>
    {planning.sharedDrillName && !planning.shared && <p><strong>Shared drill remains {planning.sharedDrillName}.</strong> This size is your planning preview.</p>}
    {!local && <p className="sq-grant-note">Hosting access is separate. {hostingLimit ? `This approved test permits at most ${hostingLimit} real participant(s).` : 'No additional hosting access is granted here.'} Planning for more players does not enroll accounts.</p>}
    <details><summary>Roster and uncovered roles</summary>
    {planning.missingCoordinated > 0 && <p><strong>{planning.missingCoordinated} coordinated {planning.missingCoordinated === 1 ? 'player still needed' : 'players still needed'}.</strong> A planning slot is not a joined member.</p>}
    {planning.additionalConfirmed > 0 && <p>{planning.additionalConfirmed} additional confirmed {planning.additionalConfirmed === 1 ? 'member remains' : 'members remain'} in the room, outside this exercise. Nobody is removed.</p>}
    <ol className="sq-roster-slots" aria-label="Confirmed and unconfirmed match slots">{planning.slots.map((slot, index) => <li key={index} data-slot-kind={slot.kind}><strong>Slot {index + 1}</strong><span>{slot.kind === 'member' ? `${slot.member.alias} — ${local ? 'synthetic demo' : 'confirmed app'} member` : slot.kind === 'needed' ? 'Coordinated player needed — not joined' : 'Unconfirmed teammate — not an app member'}</span></li>)}</ol>
    <p>Random teammates have no app assignment or Ready acknowledgement. Do not depend on their support until they explicitly agree; use a fallback if they cannot help.</p>
    <h3>Role coverage for this {planning.size}-player exercise</h3><ul className="sq-coverage">{planning.roles.map(role => <li key={role.id}><strong>{role.name}</strong>: {role.member ? `${role.member.alias} — assigned in the shared drill` : role.status === 'incompatible' ? 'Uncovered — assigned operator does not fit this role' : 'Uncovered — no compatible app member assigned'}</li>)}</ul>
      {planning.outsideDrill.length > 0 && <><h3>Responsibilities outside this drill</h3><ul>{planning.outsideDrill.map(role => <li key={role.id}>{role.name}</li>)}</ul><p>These are not assigned to randoms. Confirm separate coverage or avoid an approach that needs it.</p></>}
    </details>
    <p className="sq-caption">Generic coordination exercises only. Player minimums are not a complete map/site strategy or a verified tactical playbook.</p>
  </section>
}
