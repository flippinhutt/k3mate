import { NodeCard } from './NodeCard'

/**
 * Represents a Kubernetes node with health and resource indicators.
 *
 * @interface Node
 */
interface Node {
  name: string
  ready: boolean
  kubeletVersion?: string
  allocatable: { cpu?: string; memory?: string }
}

/**
 * Props for the ClusterOverview component.
 *
 * @interface Props
 */
interface Props {
  /** The list of nodes in the cluster. */
  nodes: Node[]
  /** Total count of pods in the cluster. */
  podCount: number
  /** Total count of deployments in the cluster. */
  deploymentCount: number
}

/**
 * ClusterOverview provides a high-level statistical overview of cluster health, including
 * node stability, total pod count, and deployment metrics. It displays a grid of summary cards
 * followed by a detailed list of individual nodes using the NodeCard component.
 *
 * @component
 * @param {Props} props The component props.
 * @returns {JSX.Element} The rendered cluster overview.
 */
export function ClusterOverview({ nodes, podCount, deploymentCount }: Props) {
  const readyNodes = nodes.filter(n => n.ready).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nodes', value: nodes.length, sub: `${readyNodes}/${nodes.length} ready`, ok: readyNodes === nodes.length },
          { label: 'Pods', value: podCount, sub: 'running', ok: true },
          { label: 'Deployments', value: deploymentCount, sub: 'total', ok: true },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors duration-150">
            <div className={`text-2xl font-bold font-mono ${stat.ok ? 'text-slate-100' : 'text-red-400'}`}>{stat.value}</div>
            <div className="text-sm text-slate-400 mt-0.5">{stat.label}</div>
            <div className="text-xs text-slate-600 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Nodes</h2>
        <div className="space-y-2">
          {nodes.map(node => <NodeCard key={node.name} {...node} />)}
        </div>
      </div>
    </div>
  )
}
