const STATUS_COLORS: Record<string, string> = {
  Running: 'bg-green-500/20 text-green-400 border-green-500/30',
  Succeeded: 'bg-green-500/20 text-green-400 border-green-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  Unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  True: 'bg-green-500/20 text-green-400 border-green-500/30',
  False: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}>
      {status}
    </span>
  )
}
