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
          className={`bg-[#0F172A] border rounded-xl p-4 transition-colors duration-150 ${
            event.type === 'Warning'
              ? 'border-yellow-500/25 hover:border-yellow-500/40'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {event.type === 'Warning' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                )}
                <span className="font-medium text-sm text-slate-200">{event.reason}</span>
                <span className="text-xs text-slate-500 font-mono">
                  {event.involvedObject.kind}/{event.involvedObject.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 break-words leading-relaxed">{event.message}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-slate-500 font-mono">{event.namespace}</div>
              {event.count > 1 && (
                <div className="text-xs text-slate-600 mt-0.5">×{event.count}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
