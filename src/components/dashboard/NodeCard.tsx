import { StatusDot } from '@/components/ui/StatusDot'

/**
 * Props for the NodeCard component.
 *
 * @interface NodeCardProps
 */
interface NodeCardProps {
  /** The unique name of the node. */
  name: string
  /** Whether the node is in a 'Ready' state according to Kubernetes indicators. */
  ready: boolean
  /** The version of kubelet running on the node. */
  kubeletVersion?: string
  /** Resource limits and allocations for the node (CPU, Memory). */
  allocatable: { cpu?: string; memory?: string }
}

/**
 * NodeCard displays summarized health and resource information for a single Kubernetes node.
 * It uses color-coded indicators (StatusDot) to signal node readiness and lists available
 * capacity metrics.
 *
 * @component
 * @param {NodeCardProps} props The component props.
 * @returns {JSX.Element} The rendered node card.
 */
export function NodeCard({ name, ready, kubeletVersion, allocatable }: NodeCardProps) {
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex items-start justify-between hover:border-slate-700 transition-colors duration-150">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <StatusDot ready={ready} />
          <span className="font-medium text-sm text-slate-100">{name}</span>
          {kubeletVersion && (
            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{kubeletVersion}</span>
          )}
        </div>
        <div className="text-xs text-slate-500 font-mono">
          CPU: {allocatable.cpu ?? '—'} · Mem: {allocatable.memory ?? '—'}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${ready ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
        {ready ? 'Ready' : 'NotReady'}
      </span>
    </div>
  )
}
