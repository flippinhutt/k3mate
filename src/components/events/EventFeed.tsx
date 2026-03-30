interface Event {
  name: string
  namespace: string
  involvedObject: { kind?: string; name?: string }
  reason?: string
  message?: string
  type: string
  count: number
  lastTimestamp?: Date | string
}

export function EventFeed({ events }: { events: Event[] }) {
  return (
    <div className="space-y-2">
      {events.map(event => (
        <div
          key={event.name}
          className={`bg-gray-900 border rounded-xl p-4 ${
            event.type === 'Warning' ? 'border-yellow-500/30' : 'border-gray-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {event.type === 'Warning' && (
                  <span className="text-yellow-400 text-xs">⚠</span>
                )}
                <span className="font-medium text-sm">{event.reason}</span>
                <span className="text-xs text-gray-500">
                  {event.involvedObject.kind}/{event.involvedObject.name}
                </span>
              </div>
              <p className="text-xs text-gray-400 break-words">{event.message}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-gray-500">{event.namespace}</div>
              {event.count > 1 && (
                <div className="text-xs text-gray-600">×{event.count}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
