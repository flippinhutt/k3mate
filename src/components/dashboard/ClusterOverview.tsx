'use client'
import { useState, useEffect } from 'react'
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

  /** Real-time metrics for nodes in the cluster (e.g. CPU/Mem usage percentage relative to limits). */
  const [metrics, setMetrics] = useState<Record<string, { cpuUsage: number; memoryUsage: number }> | null>(null)
  
  /** Current metrics polling interval in milliseconds. 0 disables auto-refresh. */
  const [refreshInterval, setRefreshInterval] = useState<number>(10000)
  
  /** True when a metrics fetch operation is currently in flight. */
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Fetches the latest resource usage metrics for all nodes from the internal proxy API.
   * Normalizes values for the NodeCard component and handles fetch states.
   *
   * @async
   * @returns {Promise<void>}
   */
  async function fetchMetrics() {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/k8s/metrics/nodes')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
      }
    } catch (e) {
      console.error('Failed to fetch node metrics', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    if (refreshInterval === 0) return

    const intervalId = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(intervalId)
  }, [refreshInterval])

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
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nodes</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0F172A] border border-slate-800 rounded-lg p-0.5">
            {[
              { label: '5s', value: 5000 },
              { label: '10s', value: 10000 },
              { label: '30s', value: 30000 },
              { label: 'Off', value: 0 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setRefreshInterval(opt.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  refreshInterval === opt.value
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchMetrics()}
            disabled={isRefreshing}
            className="p-1.5 bg-[#0F172A] border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-40 transition-colors"
            title="Refresh Metrics"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
        <div className="space-y-2">
          {nodes.map(node => <NodeCard key={node.name} metrics={metrics?.[node.name]} {...node} />)}
        </div>
      </div>
    </div>
  )
}
