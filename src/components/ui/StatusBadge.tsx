const STATUS_COLORS: Record<string, string> = {
  Running:   'bg-green-500/15 text-green-400 border-green-500/25',
  Succeeded: 'bg-green-500/15 text-green-400 border-green-500/25',
  Pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Failed:    'bg-red-500/15 text-red-400 border-red-500/25',
  Unknown:   'bg-slate-500/15 text-slate-400 border-slate-500/25',
  True:      'bg-green-500/15 text-green-400 border-green-500/25',
  False:     'bg-red-500/15 text-red-400 border-red-500/25',
}

/**
 * StatusBadge displays a color-coded status indicator for Kubernetes resources.
 * It maps common Kubernetes phases (Running, Succeeded, Pending, Failed) to 
 * specific TailwindCSS color styles.
 *
 * @component
 * @param {Object} props The component props.
 * @param {string} props.status The status string to display (e.g., "Running").
 * @returns {JSX.Element} The rendered status badge.
 */
export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border font-mono ${colors}`}>
      {status}
    </span>
  )
}
