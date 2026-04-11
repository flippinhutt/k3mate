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
  /** Real-time metrics fetched from the cluster. */
  metrics?: { cpuUsage: number; memoryUsage: number }
}

import { parseCpu, parseMemory, formatMemory } from '@/lib/utils'

/**
 * NodeCard displays summarized health and resource information for a single Kubernetes node.
 * It uses color-coded indicators (StatusDot) to signal node readiness and lists available
 * capacity metrics.
 *
 * @component
 * @param {NodeCardProps} props The component props.
 * @returns {JSX.Element} The rendered node card.
 */
export function NodeCard({ name, ready, kubeletVersion, allocatable, metrics }: NodeCardProps) {
  const cpuAllocatable = allocatable.cpu ? parseCpu(allocatable.cpu) : 0
  const memAllocatable = allocatable.memory ? parseMemory(allocatable.memory) : 0

  const cpuPercent = metrics && cpuAllocatable ? Math.round((metrics.cpuUsage / cpuAllocatable) * 100) : 0
  const memPercent = metrics && memAllocatable ? Math.round((metrics.memoryUsage / memAllocatable) * 100) : 0

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors duration-150">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <StatusDot ready={ready} />
            <span className="font-medium text-sm text-slate-100">{name}</span>
            {kubeletVersion && (
              <span className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{kubeletVersion}</span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {cpuAllocatable > 0 && `${cpuAllocatable}m cpu`}{' '}
            {memAllocatable > 0 && `· ${formatMemory(memAllocatable)} mem`}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${ready ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {ready ? 'Ready' : 'NotReady'}
        </span>
      </div>

      {metrics && (
        <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-800/50">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">CPU Usage</span>
              <span className={cpuPercent > 80 ? 'text-red-400' : 'text-slate-300'}>{cpuPercent}% ({metrics.cpuUsage}m)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${cpuPercent > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(cpuPercent, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Memory Usage</span>
              <span className={memPercent > 80 ? 'text-red-400' : 'text-slate-300'}>{memPercent}% ({formatMemory(metrics.memoryUsage)})</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${memPercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(memPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
