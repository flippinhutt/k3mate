'use client'
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Pod {
  name: string
  namespace: string
  phase: string
  ready: boolean
  restartCount: number
  podIP?: string
  nodeName?: string
  createdAt?: Date
}

interface Props {
  pods: Pod[]
}

export function PodList({ pods }: Props) {
  const [expandedPod, setExpandedPod] = useState<string | null>(null)
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
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-sm">{pod.name}</div>
                <div className="text-xs text-gray-500">{pod.namespace} · {pod.nodeName}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pod.phase} />
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedPod(null)
                    } else {
                      setExpandedPod(key)
                      fetchLogs(pod.namespace, pod.name)
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
                >
                  {isExpanded ? 'Hide logs' : 'Logs'}
                </button>
                <button
                  onClick={() => restartPod(pod.namespace, pod.name)}
                  disabled={restarting === key}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  {restarting === key ? 'Restarting…' : 'Restart'}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-gray-800 bg-gray-950 p-4">
                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                  {logs[key] ?? 'Loading…'}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
