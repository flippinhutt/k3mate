import { StatusDot } from '@/components/ui/StatusDot'

interface NodeCardProps {
  name: string
  ready: boolean
  allocatable: { cpu?: string; memory?: string }
}

export function NodeCard({ name, ready, allocatable }: NodeCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <StatusDot ready={ready} />
          <span className="font-medium text-sm">{name}</span>
        </div>
        <div className="text-xs text-gray-500">
          CPU: {allocatable.cpu ?? '—'} · Mem: {allocatable.memory ?? '—'}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${ready ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {ready ? 'Ready' : 'NotReady'}
      </span>
    </div>
  )
}
