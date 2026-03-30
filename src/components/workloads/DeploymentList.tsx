'use client'
import { useState } from 'react'
import { StatusDot } from '@/components/ui/StatusDot'

interface Deployment {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
}

interface Props {
  deployments: Deployment[]
}

export function DeploymentList({ deployments }: Props) {
  const [scaling, setScaling] = useState<string | null>(null)

  async function scale(namespace: string, name: string, replicas: number) {
    if (replicas < 0) return
    setScaling(`${namespace}/${name}`)
    await fetch(`/api/k8s/deployments/${namespace}/${name}/scale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replicas }),
    })
    setScaling(null)
  }

  return (
    <div className="space-y-2">
      {deployments.map(dep => {
        const key = `${dep.namespace}/${dep.name}`
        const ready = dep.readyReplicas >= dep.replicas && dep.replicas > 0
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusDot ready={ready} />
                <span className="font-medium text-sm">{dep.name}</span>
              </div>
              <div className="text-xs text-gray-500">{dep.namespace} · {dep.readyReplicas}/{dep.replicas} ready</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas - 1)}
                disabled={dep.replicas === 0 || scaling === key}
                className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 text-sm"
              >
                −
              </button>
              <span className="text-sm w-4 text-center">{dep.replicas}</span>
              <button
                onClick={() => scale(dep.namespace, dep.name, dep.replicas + 1)}
                disabled={scaling === key}
                className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 text-sm"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
