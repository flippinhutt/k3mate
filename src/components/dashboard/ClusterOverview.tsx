import { NodeCard } from './NodeCard'

interface Node {
  name: string
  ready: boolean
  allocatable: { cpu?: string; memory?: string }
}

interface Props {
  nodes: Node[]
  podCount: number
  deploymentCount: number
}

export function ClusterOverview({ nodes, podCount, deploymentCount }: Props) {
  const readyNodes = nodes.filter(n => n.ready).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nodes', value: nodes.length, sub: `${readyNodes} ready` },
          { label: 'Pods', value: podCount },
          { label: 'Deployments', value: deploymentCount },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
            {stat.sub && <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>}
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Nodes</h2>
        <div className="space-y-2">
          {nodes.map(node => <NodeCard key={node.name} {...node} />)}
        </div>
      </div>
    </div>
  )
}
