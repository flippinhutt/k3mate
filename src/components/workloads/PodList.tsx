'use client'
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

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

  async function fetchLogs(namespace: string, name: string) {
    const key = `${namespace}/${name}`
    const res = await fetch(`/api/k8s/pods/${namespace}/${name}/logs`)
    const data = await res.json()
    setLogs(prev => ({ ...prev, [key]: data.logs ?? data.error }))
  }

  async function restartPod(namespace: string, name: string) {
    setRestarting(`${namespace}/${name}`)
    await fetch(`/api/k8s/pods/${namespace}/${name}/restart`, { method: 'POST' })
    setRestarting(null)
  }

  return (
    <div className="space-y-2">
      {pods.map(pod => {
        const key = `${pod.namespace}/${pod.name}`
        const isExpanded = expandedPod === key
        return (
          <div key={key} className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors duration-150">
            <div className="flex items-center justify-between p-4">
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
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={pod.phase} />
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedPod(null)
                    } else {
                      setExpandedPod(key)
                      setActiveTab(prev => ({ ...prev, [key]: pod.containers?.some(c => c.hasUpdate) ? 'images' : 'logs' }))
                      fetchLogs(pod.namespace, pod.name)
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors duration-150 cursor-pointer min-h-[32px]"
                >
                  {isExpanded ? 'Hide' : 'Details'}
                </button>
                <button
                  onClick={() => restartPod(pod.namespace, pod.name)}
                  disabled={restarting === key}
                  className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors duration-150 cursor-pointer min-h-[32px]"
                >
                  {restarting === key ? '…' : 'Restart'}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-slate-800 bg-[#020617]">
                <div className="flex border-b border-slate-800">
                  {(['logs', 'ports', 'images'] as const).map(tab => {
                    const label =
                      tab === 'logs' ? 'Logs' :
                      tab === 'ports' ? `Ports${pod.ports?.length ? ` (${pod.ports.length})` : ''}` :
                      `Images${pod.containers?.some(c => c.hasUpdate) ? ' ●' : ''}`
                    const active = activeTab[key] === tab || (tab === 'logs' && !activeTab[key])
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(prev => ({ ...prev, [key]: tab }))}
                        className={`px-4 py-2.5 text-xs transition-colors duration-150 cursor-pointer ${
                          active
                            ? `text-slate-100 border-b-2 ${tab === 'images' && pod.containers?.some(c => c.hasUpdate) ? 'border-orange-400' : 'border-green-400'}`
                            : `text-slate-500 hover:text-slate-300 ${tab === 'images' && pod.containers?.some(c => c.hasUpdate) ? 'text-orange-500' : ''}`
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {activeTab[key] === 'ports' ? (
                  <div className="p-4">
                    {pod.ports && pod.ports.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {pod.ports.map((p, i) => (
                          <span key={i} className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg font-mono border border-slate-700">
                            {p.name ? `${p.name}: ` : ''}{p.containerPort}/{p.protocol}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">No ports exposed</p>
                    )}
                  </div>
                ) : activeTab[key] === 'images' ? (
                  <div className="p-4 space-y-2">
                    {pod.containers && pod.containers.length > 0 ? pod.containers.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
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
                ) : (
                  <div className="p-4">
                    <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono leading-relaxed">
                      {logs[key] ?? 'Loading…'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
