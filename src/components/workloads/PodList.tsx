'use client'
import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatMemory } from '@/lib/utils'

/**
 * Represents a port exposed by a pod container.
 *
 * @interface PodPort
 */
interface PodPort {
  /** Optional name for the port. */
  name?: string
  /** The port number on the container. */
  containerPort: number
  /** The protocol for the port (e.g., TCP, UDP). */
  protocol: string
}

/**
 * Represents a container within a pod and its update status.
 *
 * @interface PodContainer
 */
interface PodContainer {
  /** The name of the container. */
  name: string
  /** The full image name used by the container. */
  image: string
  /** Whether a newer version of the image is available. */
  hasUpdate?: boolean
  /** The tag of the latest available version. */
  latestTag?: string
  /** Whether the registry was successfully checked for updates. */
  checked?: boolean
}

/**
 * Represents a simplified Kubernetes Pod object for UI display.
 *
 * @interface Pod
 */
interface Pod {
  /** The unique name of the pod. */
  name: string
  /** The namespace where the pod is running. */
  namespace: string
  /** The current execution phase of the pod (e.g., Running, Pending). */
  phase: string
  /** Whether the pod is ready to serve traffic. */
  ready: boolean
  /** The total number of times the containers in this pod have restarted. */
  restartCount: number
  /** The IP address assigned to the pod. */
  podIP?: string
  /** The name of the node where the pod is scheduled. */
  nodeName?: string
  /** The timestamp when the pod was created. */
  createdAt?: Date
  /** List of network ports exposed by the pod. */
  ports?: PodPort[]
  /** List of containers running in the pod. */
  containers?: PodContainer[]
}

/**
 * Props for the PodList component.
 *
 * @interface Props
 */
interface Props {
  /** Array of pod objects to display. */
  pods: Pod[]
}

/**
 * PodList renders an interactive list of Kubernetes pods.
 * It provides detailed information including logs, exposed ports, and container image versions.
 * Users can also trigger pod restarts directly from the interface.
 *
 * @component
 * @param {Props} props The component props.
 * @returns {JSX.Element} The rendered pod list.
 */
export function PodList({ pods }: Props) {
  const [expandedPod, setExpandedPod] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'logs' | 'ports' | 'images'>>({})
  const [logs, setLogs] = useState<Record<string, string>>({})
  const [restarting, setRestarting] = useState<string | null>(null)
  
  /** Controls whether real-time resource usage metrics are fetched and displayed. */
  const [isMetricsEnabled, setIsMetricsEnabled] = useState(false)
  
  /** Current polling interval in milliseconds for pod metrics. */
  const [refreshInterval, setRefreshInterval] = useState<number>(10000)
  
  /** Map of pod keys (namespace/name) to their current CPU (m) and Memory (bytes) usage. */
  const [podMetrics, setPodMetrics] = useState<Record<string, { cpuUsage: number; memoryUsage: number }> | null>(null)
  
  /** True when a metrics fetch is active. */
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Fetches latest pod metrics from the metrics-server via internal API.
   * Updates podMetrics state which triggers UI refresh for the list items.
   *
   * @async
   * @returns {Promise<void>}
   */
  async function fetchPodMetrics() {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/k8s/metrics/pods')
      if (res.ok) {
        const data = await res.json()
        setPodMetrics(data.metrics)
      }
    } catch (e) {
      console.error('Failed to fetch pod metrics', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isMetricsEnabled) {
      setPodMetrics(null)
      return
    }
    fetchPodMetrics()
    if (refreshInterval === 0) return
    const intervalId = setInterval(fetchPodMetrics, refreshInterval)
    return () => clearInterval(intervalId)
  }, [isMetricsEnabled, refreshInterval])

  /**
   * Fetches the logs for a specific pod from the API.
   *
   * @async
   * @param {string} namespace The pod namespace.
   * @param {string} name The pod name.
   * @returns {Promise<void>}
   */
  async function fetchLogs(namespace: string, name: string) {
    const key = `${namespace}/${name}`
    const res = await fetch(`/api/k8s/pods/${namespace}/${name}/logs`)
    const data = await res.json()
    setLogs(prev => ({ ...prev, [key]: data.logs ?? data.error }))
  }

  /**
   * Triggers a pod restart by deleting the pod entity.
   *
   * @async
   * @param {string} namespace The pod namespace.
   * @param {string} name The pod name.
   * @returns {Promise<void>}
   */
  async function restartPod(namespace: string, name: string) {
    setRestarting(`${namespace}/${name}`)
    await fetch(`/api/k8s/pods/${namespace}/${name}/restart`, { method: 'POST' })
    setRestarting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pods ({pods.length})</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMetricsEnabled(!isMetricsEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
              isMetricsEnabled 
                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                : 'bg-[#0F172A] border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isMetricsEnabled ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
            Live Metrics
          </button>
          
          {isMetricsEnabled && (
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
          )}

          <button
            onClick={() => fetchPodMetrics()}
            disabled={!isMetricsEnabled || isRefreshing}
            className="p-1.5 bg-[#0F172A] border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-20 transition-colors"
            title="Refresh Metrics"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {pods.map(pod => {
          const key = `${pod.namespace}/${pod.name}`
          const isExpanded = expandedPod === key
          return (
            <div key={key} className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors duration-150">
              <div className="flex items-center justify-between p-4" onClick={() => setExpandedPod(isExpanded ? null : key)} style={{ cursor: 'pointer' }}>
                <div className="min-w-0 mr-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-100">{pod.name}</span>
                    {pod.containers?.some(c => c.hasUpdate) && (
                      <span className="text-xs bg-orange-500/15 border border-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded font-mono">
                        update available
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{pod.namespace} · {pod.nodeName}</div>
                </div>

                <div className="hidden sm:flex items-center gap-6 mr-6 transition-opacity duration-300">
                  {isMetricsEnabled && podMetrics?.[key] && (
                    <>
                      <div className="flex flex-col items-end">
                        <div className="text-[10px] uppercase text-slate-600 font-bold tracking-tight">CPU</div>
                        <div className="text-xs text-blue-400 font-mono">{podMetrics[key].cpuUsage}m</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-[10px] uppercase text-slate-600 font-bold tracking-tight">MEM</div>
                        <div className="text-xs text-purple-400 font-mono">{formatMemory(podMetrics[key].memoryUsage, 0)}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={pod.phase} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedPod(isExpanded ? null : key)
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-800">
                  <div className="flex border-b border-slate-800 bg-slate-900/30">
                    {[
                      { id: 'images', label: 'Images' },
                      { id: 'ports', label: 'Ports' },
                      { id: 'logs', label: 'Logs' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(prev => ({ ...prev, [key]: tab.id as 'images' | 'ports' | 'logs' }))}
                        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                          (activeTab[key] ?? 'images') === tab.id
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        restartPod(pod.namespace, pod.name)
                      }}
                      disabled={restarting === key}
                      className="px-3 py-1 mr-2 my-auto text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 ${restarting === key ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {restarting === key ? 'restarting…' : 'restart'}
                    </button>
                  </div>

                  {(activeTab[key] ?? 'images') === 'images' ? (
                    <div className="p-4 space-y-3">
                      {pod.containers?.length ? pod.containers.map(c => (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-mono w-24 shrink-0 truncate" title={c.name}>{c.name}</span>
                          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded font-mono truncate max-w-[280px]" title={c.image}>
                            {c.image}
                          </span>
                          {c.hasUpdate && c.latestTag ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-500/15 border border-orange-500/30 text-orange-400 px-2 py-1 rounded font-mono">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                              </svg>
                              {c.latestTag}
                            </span>
                          ) : c.checked === false ? (
                            <span className="text-xs text-slate-600 font-mono">registry not checked</span>
                          ) : (
                            <span className="text-xs text-green-500/60 font-mono">up to date</span>
                          )}
                        </div>
                      )) : (
                        <p className="text-xs text-slate-600">No containers</p>
                      )}
                    </div>
                  ) : (activeTab[key] ?? 'images') === 'ports' ? (
                    <div className="p-4 space-y-2">
                       {pod.ports?.length ? pod.ports.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-mono">{p.name || 'unnamed'}</span>
                          <span className="text-xs text-slate-200 font-mono font-medium">{p.containerPort}</span>
                          <span className="text-[10px] text-slate-600 uppercase font-bold">{p.protocol}</span>
                        </div>
                       )) : (
                        <p className="text-xs text-slate-600">No ports defined</p>
                       )}
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500">Last 100 lines</span>
                        <button 
                          onClick={() => fetchLogs(pod.namespace, pod.name)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Refresh Logs
                        </button>
                      </div>
                      <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono leading-relaxed bg-[#020617] p-3 rounded-lg border border-slate-800/50">
                        {logs[key] ?? 'Click refresh to load logs…'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
