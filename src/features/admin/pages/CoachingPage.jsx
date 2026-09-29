import { useState } from 'react'
import AppointmentsCalendar from '../../../components/admin/AppointmentsCalendar'
import AvailabilityEditor from '../../../components/admin/AvailabilityEditor'
import { PageHeader } from '../ui'

export default function CoachingPage() {
  const [calendarVersion, setCalendarVersion] = useState(0)
  return (
    <>
      <PageHeader
        title="Coaching"
        description="Booked sessions, the live calendar and the hours customers can book. Changes here update the public booking page immediately."
        actions={<a className="ax-btn ax-btn--sm" href="/coaching/index.html#book" target="_blank" rel="noreferrer">Public booking page</a>}
      />
      <AppointmentsCalendar reloadSignal={calendarVersion} />
      <AvailabilityEditor onSaved={() => setCalendarVersion((v) => v + 1)} />
    </>
  )
}
