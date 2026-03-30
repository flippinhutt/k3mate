import { Shell } from '@/components/layout/Shell'
import { EventFeed } from '@/components/events/EventFeed'

async function getEvents() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/k8s/events`, { next: { revalidate: 10 } })
  const { events } = await res.json()
  return events ?? []
}

export default async function EventsPage() {
  const events = await getEvents()
  return (
    <Shell>
      <h1 className="text-xl font-bold mb-6">Events</h1>
      <EventFeed events={events} />
    </Shell>
  )
}
